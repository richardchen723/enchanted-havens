import type { NextRequest } from "next/server"
import { isDatabaseConfigured } from "@/lib/db"
import {
  addHostawayIncomingGuestMessage,
  createHostawayInquiry,
  isHostawayConfigured,
  sendHostawayConversationMessage,
  waitForConversationForReservation,
} from "@/lib/hostaway"
import {
  buildHostawayGuestConversationMessage,
  buildHostawayInquiryNote,
  buildInitialTextMessage,
  buildTextInquiryFingerprint,
  buildTextInquiryPlaceholderEmail,
  createTextInquirySchema,
  hashTextInquiryClientIp,
  normalizeTextPhone,
  splitGuestName,
  validateStayDateRange,
} from "@/lib/text-inquiry"
import { getTextInquiryListing } from "@/lib/text-inquiry-listings"
import {
  countRecentTextInquiryAttempts,
  createTextInquiryRecord,
  getTextInquiryByIdempotencyKey,
  markTextInquiryFailed,
  markTextInquiryHostawayCreated,
  markTextInquiryReady,
  retryFailedTextInquiry,
  type TextInquiryRecord,
} from "@/lib/text-inquiries"

export const dynamic = "force-dynamic"

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

function getClientIpHash(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const clientIdentifier = forwardedFor || request.headers.get("x-real-ip") || `unknown:${request.headers.get("user-agent") || "browser"}`
  return hashTextInquiryClientIp(clientIdentifier)
}

function buildReadyResponse(record: TextInquiryRecord, reused: boolean) {
  return {
    success: true,
    reused,
    inquiryId: record.hostawayReservationId,
    conversationId: record.hostawayConversationId,
    textMessageSent: Boolean(record.smsMessageId),
    smsMessageId: record.smsMessageId,
    smsStatus: record.smsStatus,
  }
}

export async function POST(request: NextRequest) {
  let activeRecord: TextInquiryRecord | null = null

  try {
    if (!isDatabaseConfigured()) return jsonResponse({ error: "Text inquiries are temporarily unavailable." }, 503)
    if (process.env.HOSTAWAY_SMS_ENABLED === "false" || !isHostawayConfigured()) {
      return jsonResponse({ error: "Text messaging is not configured yet. Please use the inquiry form instead." }, 503)
    }

    const parsed = createTextInquirySchema.parse(await request.json())
    if (parsed.website) return jsonResponse({ error: "Invalid inquiry" }, 400)
    validateStayDateRange(parsed.checkIn, parsed.checkOut)

    const listing = getTextInquiryListing(parsed.listingSlug)
    if (!listing) return jsonResponse({ error: "Please select a valid haven." }, 400)
    if (parsed.guests > listing.maxGuests) {
      return jsonResponse({ error: `${listing.name} accommodates up to ${listing.maxGuests} guests.` }, 400)
    }

    const guestPhone = normalizeTextPhone(parsed.guestPhone, parsed.countryCallingCode)
    const normalizedDetails = { ...parsed, guestPhone, havenName: listing.name }
    const requestFingerprint = buildTextInquiryFingerprint(normalizedDetails)
    const clientIpHash = getClientIpHash(request)
    const existing = await getTextInquiryByIdempotencyKey(parsed.idempotencyKey)

    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) return jsonResponse({ error: "This inquiry key was already used." }, 409)
      if (existing.status === "ready" && existing.smsMessageId) return jsonResponse(buildReadyResponse(existing, true), 200)
      if (existing.status === "pending") {
        return jsonResponse({ error: "Your inquiry is still being prepared. Please try again in a moment." }, 409)
      }
    }

    const configuredLimit = Number.parseInt(process.env.TEXT_INQUIRY_RATE_LIMIT || "5", 10)
    const rateLimit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 5
    if (await countRecentTextInquiryAttempts(guestPhone, clientIpHash) >= rateLimit) {
      return jsonResponse({ error: "Too many inquiry attempts. Please use the inquiry form or try again later." }, 429)
    }

    if (existing?.status === "failed") {
      if (!await retryFailedTextInquiry(existing.id)) {
        return jsonResponse({ error: "Your inquiry is already being retried. Please wait a moment." }, 409)
      }
      activeRecord = { ...existing, status: "pending", errorMessage: null }
    } else {
      const reserved = await createTextInquiryRecord({
        idempotencyKey: parsed.idempotencyKey,
        requestFingerprint,
        clientIpHash,
        guestName: parsed.guestName,
        guestPhone,
        listingSlug: parsed.listingSlug,
        checkIn: parsed.checkIn,
        checkOut: parsed.checkOut,
        guests: parsed.guests,
        message: parsed.message,
        sourcePath: parsed.sourcePath,
      })
      activeRecord = reserved.record

      if (!reserved.created) {
        if (reserved.record.requestFingerprint !== requestFingerprint) return jsonResponse({ error: "This inquiry key was already used." }, 409)
        if (reserved.record.status === "ready" && reserved.record.smsMessageId) return jsonResponse(buildReadyResponse(reserved.record, true), 200)
        return jsonResponse({ error: "Your inquiry is still being prepared. Please try again in a moment." }, 409)
      }
    }

    let hostawayReservationId = activeRecord.hostawayReservationId
    if (!hostawayReservationId) {
      const { firstName, lastName } = splitGuestName(parsed.guestName)
      const inquiry = await createHostawayInquiry({
        listingId: listing.listingId,
        checkIn: parsed.checkIn,
        checkOut: parsed.checkOut,
        guests: parsed.guests,
        guest: {
          firstName,
          lastName,
          email: buildTextInquiryPlaceholderEmail(guestPhone),
          phone: guestPhone,
        },
        note: buildHostawayInquiryNote(normalizedDetails),
      })
      hostawayReservationId = Number(inquiry.id || inquiry.hostawayReservationId)
      if (Number.isInteger(hostawayReservationId) && hostawayReservationId > 0) {
        await markTextInquiryHostawayCreated(activeRecord.id, hostawayReservationId)
      }
    }

    if (!hostawayReservationId || !Number.isInteger(hostawayReservationId) || hostawayReservationId <= 0) {
      throw new Error("Hostaway did not return a valid inquiry ID")
    }

    const conversation = await waitForConversationForReservation(hostawayReservationId, { attempts: 10, delayMs: 750 })
    if (!conversation?.id) throw new Error("Hostaway did not create an inbox conversation for this inquiry")

    const guestMessage = buildHostawayGuestConversationMessage(normalizedDetails)
    const guestMessageAlreadyPreserved = guestMessage && conversation.conversationMessages?.some((message) => (
      Number(message.isIncoming) === 1 && message.body?.trim() === guestMessage
    ))
    if (guestMessage && !guestMessageAlreadyPreserved) await addHostawayIncomingGuestMessage(conversation.id, guestMessage)

    const initialTextMessage = buildInitialTextMessage(normalizedDetails, hostawayReservationId)
    const existingSmsMessage = conversation.conversationMessages?.find((message) => (
      message.communicationType === "sms" && !message.isIncoming && message.body === initialTextMessage
    ))
    const smsMessage = existingSmsMessage || await sendHostawayConversationMessage(conversation.id, initialTextMessage, "sms")
    const smsMessageId = Number(smsMessage.id)

    if (!Number.isInteger(smsMessageId) || smsMessageId <= 0) throw new Error("Hostaway did not return a valid SMS message ID")
    if (["failed", "cancelled_by_user", "cancelled_by_system"].includes(smsMessage.status || "")) {
      throw new Error("Hostaway could not send the text message")
    }

    await markTextInquiryReady(activeRecord.id, hostawayReservationId, conversation.id, smsMessageId, smsMessage.status || null)
    return jsonResponse({
      success: true,
      reused: false,
      inquiryId: hostawayReservationId,
      conversationId: conversation.id,
      textMessageSent: true,
      smsMessageId,
      smsStatus: smsMessage.status || null,
    }, 201)
  } catch (error) {
    if (activeRecord) {
      await markTextInquiryFailed(activeRecord.id, error instanceof Error ? error.message : "Failed to prepare text inquiry").catch(() => undefined)
    }

    if (error && typeof error === "object" && Reflect.get(error, "name") === "ZodError") {
      return jsonResponse({ error: "Please check the inquiry details." }, 400)
    }

    console.error("Failed to prepare text inquiry:", error)
    return jsonResponse({ error: "We couldn't send your text. Please try again or use the inquiry form." }, 500)
  }
}
