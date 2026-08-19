import { createHash } from "node:crypto"
import { z } from "zod"
import { labelHostawayGuestMessage } from "@/lib/hostaway-message-source"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const E164_PATTERN = /^\+[1-9]\d{7,14}$/

const dateField = z
  .string()
  .regex(DATE_PATTERN, "Use YYYY-MM-DD format")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
  }, "Invalid date")

export const createTextInquirySchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    guestName: z.string().trim().min(2).max(255),
    guestPhone: z.string().trim().min(5).max(40),
    countryCallingCode: z.string().trim().regex(/^\+[1-9]\d{0,3}$/),
    listingSlug: z.string().trim().min(1).max(100),
    checkIn: dateField,
    checkOut: dateField,
    guests: z.number().int().min(1).max(60),
    message: z.string().trim().max(1000).optional().default(""),
    sourcePath: z.string().trim().max(500).optional().default("/"),
    website: z.string().max(0).optional().default(""),
  })
  .superRefine((value, context) => {
    if (value.checkOut <= value.checkIn) {
      context.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Check-out must be after check-in",
      })
    }
  })

export type CreateTextInquiryInput = z.infer<typeof createTextInquirySchema>

export type TextInquiryDetails = Omit<CreateTextInquiryInput, "guestPhone" | "countryCallingCode" | "website"> & {
  guestPhone: string
  havenName: string
}

export function normalizeTextPhone(phone: string, countryCallingCode = "+1") {
  const trimmedPhone = phone.trim()
  const callingCodeDigits = countryCallingCode.replace(/\D/g, "")
  let phoneDigits = trimmedPhone.replace(/\D/g, "")

  if (!phoneDigits) throw new Error("Mobile phone number is required")

  if (!trimmedPhone.startsWith("+")) {
    phoneDigits = phoneDigits.replace(/^0+/, "")
    if (!phoneDigits.startsWith(callingCodeDigits)) phoneDigits = `${callingCodeDigits}${phoneDigits}`
  }

  const normalized = `+${phoneDigits}`
  if (!E164_PATTERN.test(normalized)) throw new Error("Enter a valid mobile number with country code")
  return normalized
}

export function splitGuestName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || "Guest",
    lastName: parts.slice(1).join(" ") || "Guest",
  }
}

export function validateStayDateRange(checkIn: string, checkOut: string, today = new Date()) {
  if (!DATE_PATTERN.test(checkIn) || !DATE_PATTERN.test(checkOut)) {
    throw new Error("Stay dates must use YYYY-MM-DD format")
  }

  const checkInDate = new Date(`${checkIn}T00:00:00Z`)
  const checkOutDate = new Date(`${checkOut}T00:00:00Z`)
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) throw new Error("Stay dates are invalid")
  if (checkInDate < todayUtc) throw new Error("Check-in cannot be in the past")
  if (checkOutDate <= checkInDate) throw new Error("Check-out must be after check-in")

  const maximumCheckOut = new Date(todayUtc)
  maximumCheckOut.setUTCFullYear(maximumCheckOut.getUTCFullYear() + 3)
  if (checkOutDate > maximumCheckOut) throw new Error("Check-out is too far in the future")
}

export function buildHostawayInquiryNote(details: TextInquiryDetails) {
  return [
    `Website text-message inquiry from ${details.guestName}.`,
    `Haven: ${details.havenName}`,
    `Stay dates: ${details.checkIn} to ${details.checkOut}`,
    `Guests: ${details.guests}`,
    `Mobile phone: ${details.guestPhone}`,
    "Text consent: Guest requested a transactional SMS from the website inquiry form.",
    `Source page: ${details.sourcePath}`,
    details.message ? `Guest message: ${details.message}` : null,
  ].filter(Boolean).join("\n")
}

export function buildHostawayGuestConversationMessage(details: Pick<TextInquiryDetails, "message">) {
  const message = details.message.trim()
  return message ? labelHostawayGuestMessage(message, "text_message_form") : null
}

function formatCompactStayDates(checkIn: string, checkOut: string) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
  return `${formatter.format(new Date(`${checkIn}T00:00:00Z`))}–${formatter.format(new Date(`${checkOut}T00:00:00Z`))}`
}

export type InitialInquiryTextContext = {
  havenName?: string | null
  checkIn?: string | null
  checkOut?: string | null
  generalInquiry?: boolean
}

export function buildInitialInquiryTextMessage(context: InitialInquiryTextContext, hostawayReservationId: number) {
  const prefix = `Enchanted Havens Stay Team: Inquiry #${hostawayReservationId}`
  const suffix = " received. Reply to continue. Msg & data rates may apply. Reply STOP to opt out."
  if (context.generalInquiry) return `${prefix}${suffix}`

  const dates = context.checkIn && context.checkOut
    ? formatCompactStayDates(context.checkIn, context.checkOut)
    : null
  const havenName = context.havenName?.trim() || null
  const dateContext = dates ? `, ${dates}` : ""
  const availableNameCharacters = Math.max(1, 160 - prefix.length - suffix.length - " for ".length - dateContext.length)
  const stayContext = havenName
    ? ` for ${havenName.slice(0, availableNameCharacters).trimEnd()}${dateContext}`
    : dates
      ? ` for ${dates}`
      : ""

  return `${prefix}${stayContext}${suffix}`
}

export function buildInitialTextMessage(details: TextInquiryDetails, hostawayReservationId: number) {
  return buildInitialInquiryTextMessage(details, hostawayReservationId)
}

export function buildTextInquiryFingerprint(details: Omit<TextInquiryDetails, "havenName">) {
  return createHash("sha256").update(JSON.stringify({
    guestName: details.guestName,
    guestPhone: details.guestPhone,
    listingSlug: details.listingSlug,
    checkIn: details.checkIn,
    checkOut: details.checkOut,
    guests: details.guests,
    message: details.message,
    sourcePath: details.sourcePath,
  })).digest("hex")
}

export function hashTextInquiryClientIp(ipAddress: string) {
  const salt = process.env.TEXT_INQUIRY_HASH_SALT || process.env.BOOKING_TERMS_VERSION || "enchanted-havens"
  return createHash("sha256").update(`${salt}:${ipAddress}`).digest("hex")
}

export function buildTextInquiryPlaceholderEmail(phone: string) {
  const digits = phone.replace(/\D/g, "") || "guest"
  return `text+${digits}@guest.enchantedhavens.com`
}
