import { createHash, randomBytes, randomUUID } from "node:crypto"
import { z } from "zod"
import { db, ensureSchema, isDatabaseConfigured } from "@/lib/db"
import {
  addHostawayIncomingGuestMessage,
  createHostawayInquiry,
  getConversationForReservation,
  getHostawayConversation,
  getNearestAvailableInquiryDates,
  sendHostawayConversationMessage,
  waitForConversationForReservation,
} from "@/lib/hostaway"
import {
  buildGuestChatFallbackSms,
  buildGuestChatPlaceholderEmail,
  GUEST_CHAT_AUTOMATED_RESPONSE,
  GUEST_CHAT_WEBCHAT_ONLY_AUTOMATED_RESPONSE,
  hostawayMessageBodyToPlainText,
} from "@/lib/guest-chat-utils"
import { labelHostawayGuestMessage } from "@/lib/hostaway-message-source"
import { buildInitialInquiryTextMessage, normalizeTextPhone, splitGuestName } from "@/lib/text-inquiry"
import { getTextInquiryListing } from "@/lib/text-inquiry-listings"
import type {
  AppendGuestChatMessageInput,
  CreateGuestChatThreadInput,
  GuestChatAuthorType,
  GuestChatContext,
  GuestChatIntent,
  GuestChatMessage,
  GuestChatSyncStatus,
  GuestChatThreadDetail,
  GuestChatThreadStatus,
} from "@/types/guest-chat"

export const CHAT_UNAVAILABLE_ERROR = "Guest chat is unavailable"
export const GENERAL_INQUIRY_LISTING_SLUG = "blue-haven"

type SqlParameter = string | number | boolean | null | Date | string[] | number[]

async function query<T extends Record<string, unknown>>(statement: string, parameters: SqlParameter[] = []) {
  await ensureSchema()
  const result = await db().unsafe(statement, parameters as never[]) as unknown as T[] & { count?: number }
  return { rows: Array.from(result), rowCount: result.count ?? result.length }
}

function assertChatAvailable() {
  if (!isDatabaseConfigured()) throw new Error(CHAT_UNAVAILABLE_ERROR)
}

function isHostawaySmsFallbackEnabled() {
  const hostawayConfigured = Boolean(
    process.env.HOSTAWAY_ACCESS_TOKEN || (process.env.HOSTAWAY_CLIENT_ID && process.env.HOSTAWAY_CLIENT_SECRET),
  )
  return process.env.HOSTAWAY_SMS_ENABLED !== "false" && hostawayConfigured
}

const optionalStringField = (maxLength: number) => z.preprocess(
  (value) => typeof value === "string" ? value.trim() || null : value ?? null,
  z.string().max(maxLength).nullable().optional(),
)

const optionalIntegerField = (min: number, max: number) => z.preprocess(
  (value) => value === undefined || value === null || value === "" ? null : typeof value === "string" ? Number.parseInt(value, 10) : value,
  z.number().int().min(min).max(max).nullable().optional(),
)

export const guestChatContextSchema = z.object({
  listingSlug: optionalStringField(100),
  havenName: optionalStringField(255),
  checkIn: optionalStringField(10),
  checkOut: optionalStringField(10),
  guests: optionalIntegerField(1, 60),
  sourcePath: optionalStringField(500),
  sourceType: optionalStringField(100),
})

export const createGuestChatThreadSchema = z.object({
  guestName: z.string().trim().min(1).max(255),
  guestPhone: z.string().trim().min(1).max(50),
  message: z.string().trim().min(1).max(4000),
  intent: z.enum(["availability", "haven_question", "special_request", "general"]).optional(),
  context: guestChatContextSchema.partial().optional(),
})

export const appendGuestChatMessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  guestPhone: optionalStringField(50),
  context: guestChatContextSchema.partial().optional(),
})

export const guestChatPresenceSchema = z.object({ state: z.enum(["open", "heartbeat", "closed"]) })

type ThreadRow = {
  id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  status: GuestChatThreadStatus
  intent: GuestChatIntent
  hostaway_reservation_id: number | string | null
  source_path: string | null
  source_type: string | null
  listing_slug: string | null
  haven_name: string | null
  check_in: string | Date | null
  check_out: string | Date | null
  guests: number | string | null
  last_message_preview: string | null
  last_message_at: string | Date | null
  guest_unread_count: number | string | null
  created_at: string | Date
  updated_at: string | Date
  closed_at: string | Date | null
}

type MessageRow = {
  id: string
  thread_id: string
  author_type: GuestChatAuthorType
  body: string
  hostaway_message_id: number | string | null
  hostaway_sync_status: GuestChatSyncStatus
  hostaway_sync_error: string | null
  created_at: string | Date
}

const THREAD_SELECT = `
  select
    t.id, t.guest_name, t.guest_email, t.guest_phone, t.status, t.intent,
    t.hostaway_reservation_id, t.source_path, t.source_type, t.listing_slug,
    t.haven_name, t.check_in, t.check_out, t.guests,
    (select m.body from guest_chat_messages m where m.thread_id = t.id and m.author_type <> 'system' order by m.created_at desc limit 1) as last_message_preview,
    (select m.created_at from guest_chat_messages m where m.thread_id = t.id and m.author_type <> 'system' order by m.created_at desc limit 1) as last_message_at,
    (select count(*)::int from guest_chat_messages m where m.thread_id = t.id and m.author_type = 'staff' and m.created_at > coalesce(t.last_guest_read_at, to_timestamp(0))) as guest_unread_count,
    t.created_at, t.updated_at, t.closed_at
  from guest_chat_threads t
`

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function nullableInteger(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function iso(value: string | Date | null | undefined) {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function dateOnly(value: string | Date | null | undefined) {
  if (!value) return null
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10)
}

function normalizeContext(context?: Partial<GuestChatContext> | null): GuestChatContext {
  const value = guestChatContextSchema.partial().parse(context ?? {})
  return {
    listingSlug: value.listingSlug ?? null,
    havenName: value.havenName ?? null,
    checkIn: value.checkIn ?? null,
    checkOut: value.checkOut ?? null,
    guests: value.guests ?? null,
    sourcePath: value.sourcePath ?? null,
    sourceType: value.sourceType ?? null,
  }
}

function mergeContext(current: GuestChatContext, next?: Partial<GuestChatContext> | null): GuestChatContext {
  const incoming = normalizeContext(next)
  return {
    listingSlug: incoming.listingSlug ?? current.listingSlug,
    havenName: incoming.havenName ?? current.havenName,
    checkIn: incoming.checkIn ?? current.checkIn,
    checkOut: incoming.checkOut ?? current.checkOut,
    guests: incoming.guests ?? current.guests,
    sourcePath: incoming.sourcePath ?? current.sourcePath,
    sourceType: incoming.sourceType ?? current.sourceType,
  }
}

function mapThread(row: ThreadRow): Omit<GuestChatThreadDetail, "messages" | "canConvertToInquiry"> {
  const preview = row.last_message_preview?.trim() || null
  return {
    id: row.id,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    guestPhone: row.guest_phone,
    status: row.status,
    intent: row.intent,
    hostawayReservationId: nullableInteger(row.hostaway_reservation_id),
    lastMessagePreview: preview && preview.length > 140 ? `${preview.slice(0, 137)}...` : preview,
    lastMessageAt: iso(row.last_message_at),
    guestUnreadCount: nullableInteger(row.guest_unread_count) ?? 0,
    context: {
      listingSlug: row.listing_slug,
      havenName: row.haven_name,
      checkIn: dateOnly(row.check_in),
      checkOut: dateOnly(row.check_out),
      guests: nullableInteger(row.guests),
      sourcePath: row.source_path,
      sourceType: row.source_type,
    },
    createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
    updatedAt: iso(row.updated_at) ?? new Date(0).toISOString(),
    closedAt: iso(row.closed_at),
  }
}

function mapMessage(row: MessageRow): GuestChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    authorType: row.author_type,
    body: row.body,
    hostawayMessageId: nullableInteger(row.hostaway_message_id),
    hostawaySyncStatus: row.hostaway_sync_status,
    hostawaySyncError: row.hostaway_sync_error,
    createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
  }
}

async function getThread(threadId: string, guestToken?: string) {
  const parameters: SqlParameter[] = [threadId]
  let access = ""
  if (guestToken) {
    access = " and t.guest_token_hash = $2"
    parameters.push(tokenHash(guestToken))
  }
  const result = await query<ThreadRow>(`${THREAD_SELECT} where t.id = $1${access} limit 1`, parameters)
  return result.rows[0] || null
}

async function getMessages(threadId: string) {
  const result = await query<MessageRow>(`
    select id, thread_id, author_type, body, hostaway_message_id, hostaway_sync_status, hostaway_sync_error, created_at
    from guest_chat_messages where thread_id = $1 order by created_at asc
  `, [threadId])
  return result.rows.map(mapMessage)
}

async function getThreadDetail(threadId: string, guestToken?: string): Promise<GuestChatThreadDetail | null> {
  const row = await getThread(threadId, guestToken)
  if (!row) return null
  const summary = mapThread(row)
  return { ...summary, messages: await getMessages(threadId), canConvertToInquiry: !summary.hostawayReservationId && summary.status !== "spam" }
}

export async function getGuestChatThreadForGuest(threadId: string, guestToken: string) {
  assertChatAvailable()
  return getThreadDetail(threadId, guestToken)
}

async function getThreadForService(threadId: string) {
  assertChatAvailable()
  return getThreadDetail(threadId)
}

export async function createGuestChatThread(input: CreateGuestChatThreadInput) {
  assertChatAvailable()
  const parsed = createGuestChatThreadSchema.parse(input)
  const context = normalizeContext(parsed.context)
  const guestToken = randomBytes(24).toString("hex")
  const guestPhone = normalizeTextPhone(parsed.guestPhone, "+1")
  const threadId = randomUUID()

  await query(`
    insert into guest_chat_threads (
      id, guest_token_hash, guest_name, guest_email, guest_phone, status, intent,
      source_path, source_type, listing_slug, haven_name, check_in, check_out, guests,
      last_guest_read_at, webchat_opened_at, webchat_last_seen_at
    ) values ($1, $2, $3, $4, $5, 'waiting_on_team', $6, $7, $8, $9, $10, $11, $12, $13, now(), now(), now())
  `, [threadId, tokenHash(guestToken), parsed.guestName, buildGuestChatPlaceholderEmail(guestPhone), guestPhone,
    parsed.intent || "general", context.sourcePath, context.sourceType, context.listingSlug, context.havenName,
    context.checkIn, context.checkOut, context.guests])

  await query(`insert into guest_chat_messages (id, thread_id, author_type, body) values ($1, $2, 'guest', $3)`,
    [randomUUID(), threadId, parsed.message])
  await query(`insert into guest_chat_messages (id, thread_id, author_type, body) values ($1, $2, 'system', $3)`,
    [randomUUID(), threadId, isHostawaySmsFallbackEnabled() ? GUEST_CHAT_AUTOMATED_RESPONSE : GUEST_CHAT_WEBCHAT_ONLY_AUTOMATED_RESPONSE])

  const thread = await getGuestChatThreadForGuest(threadId, guestToken)
  if (!thread) throw new Error("Failed to load chat thread")
  return { thread, guestToken }
}

async function setMessageSync(messageId: string, status: GuestChatSyncStatus, hostawayMessageId: number | null, error: string | null) {
  await query(`update guest_chat_messages set hostaway_sync_status = $2, hostaway_message_id = $3, hostaway_sync_error = $4 where id = $1`,
    [messageId, status, hostawayMessageId, error])
}

async function mirrorGuestMessage(thread: GuestChatThreadDetail, messageId: string, body: string) {
  if (!thread.hostawayReservationId) return
  try {
    const conversation = await waitForConversationForReservation(thread.hostawayReservationId)
    if (!conversation?.id) throw new Error("Hostaway conversation is not available")
    const result = await addHostawayIncomingGuestMessage(conversation.id, labelHostawayGuestMessage(body, "webchat"))
    await setMessageSync(messageId, "mirrored", Number(result.id), null)
  } catch (error) {
    await setMessageSync(messageId, "failed", null, error instanceof Error ? error.message : "Failed to mirror message")
  }
}

async function sendInitialChatAcknowledgement(
  thread: GuestChatThreadDetail,
  reservationId: number,
  conversation: NonNullable<Awaited<ReturnType<typeof waitForConversationForReservation>>>,
  fallbackHavenName: string,
) {
  if (!isHostawaySmsFallbackEnabled()) return

  const body = buildInitialInquiryTextMessage({
    generalInquiry: thread.intent === "general",
    havenName: thread.context.havenName || fallbackHavenName,
    checkIn: thread.context.checkIn,
    checkOut: thread.context.checkOut,
  }, reservationId)

  try {
    const existing = conversation.conversationMessages?.find((message) => (
      message.communicationType === "sms" && Number(message.isIncoming) !== 1 && message.body === body
    ))
    const sent = existing || await sendHostawayConversationMessage(conversation.id, body, "sms")
    const messageId = Number(sent.id)
    if (!Number.isInteger(messageId) || messageId <= 0) throw new Error("Hostaway did not return a valid SMS message ID")
    if (["failed", "cancelled_by_user", "cancelled_by_system"].includes(sent.status || "")) {
      throw new Error("Hostaway could not send the inquiry acknowledgement")
    }

    await query(`update guest_chat_threads set initial_sms_message_id = $2, initial_sms_status = $3,
      initial_sms_sent_at = now(), initial_sms_error = null where id = $1`,
      [thread.id, messageId, sent.status || null])
    await query(`delete from guest_chat_messages where thread_id = $1 and author_type = 'staff' and hostaway_message_id = $2`,
      [thread.id, messageId])
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send inquiry acknowledgement"
    await query(`update guest_chat_threads set initial_sms_status = 'failed', initial_sms_error = $2 where id = $1`,
      [thread.id, message]).catch(() => undefined)
    console.error("Failed to send initial Enchanted Havens chat acknowledgement:", error)
  }
}

export async function appendGuestMessageToThread(threadId: string, guestToken: string, input: AppendGuestChatMessageInput) {
  assertChatAvailable()
  const parsed = appendGuestChatMessageSchema.parse(input)
  const existing = await getGuestChatThreadForGuest(threadId, guestToken)
  if (!existing) throw new Error("Chat thread not found")
  if (existing.status === "closed" || existing.status === "spam") throw new Error("This conversation is closed")

  const context = mergeContext(existing.context, parsed.context)
  const guestPhone = parsed.guestPhone ? normalizeTextPhone(parsed.guestPhone, "+1") : existing.guestPhone
  const messageId = randomUUID()
  await query(`insert into guest_chat_messages (id, thread_id, author_type, body) values ($1, $2, 'guest', $3)`, [messageId, threadId, parsed.message])
  await query(`
    update guest_chat_threads set guest_phone = $2, status = 'waiting_on_team', source_path = $3, source_type = $4,
      listing_slug = $5, haven_name = $6, check_in = $7, check_out = $8, guests = $9,
      last_guest_read_at = now(), updated_at = now() where id = $1
  `, [threadId, guestPhone, context.sourcePath, context.sourceType, context.listingSlug, context.havenName, context.checkIn, context.checkOut, context.guests])

  const updated = await getGuestChatThreadForGuest(threadId, guestToken)
  if (!updated) throw new Error("Failed to load updated thread")
  await mirrorGuestMessage(updated, messageId, parsed.message)
  return await getGuestChatThreadForGuest(threadId, guestToken) || updated
}

export async function markGuestThreadRead(threadId: string, guestToken: string) {
  assertChatAvailable()
  const result = await query(`update guest_chat_threads set last_guest_read_at = now() where id = $1 and guest_token_hash = $2`,
    [threadId, tokenHash(guestToken)])
  return result.rowCount === 1 ? getGuestChatThreadForGuest(threadId, guestToken) : null
}

export async function updateGuestChatPresence(threadId: string, guestToken: string, state: "open" | "heartbeat" | "closed") {
  assertChatAvailable()
  guestChatPresenceSchema.parse({ state })
  const assignment = state === "closed"
    ? "webchat_closed_at = now(), webchat_last_seen_at = now()"
    : state === "open"
      ? "webchat_opened_at = now(), webchat_last_seen_at = now(), webchat_closed_at = null"
      : "webchat_last_seen_at = now(), webchat_closed_at = null"
  const result = await query(`update guest_chat_threads set ${assignment} where id = $1 and guest_token_hash = $2`,
    [threadId, tokenHash(guestToken)])
  return result.rowCount === 1
}

export async function syncHostawayTeamRepliesToThread(thread: GuestChatThreadDetail) {
  if (!thread.hostawayReservationId) return 0
  const conversation = await getConversationForReservation(thread.hostawayReservationId)
  if (!conversation?.conversationMessages?.length) return 0
  const initialSms = await query<{ initial_sms_message_id: number | string | null }>(
    `select initial_sms_message_id from guest_chat_threads where id = $1 limit 1`,
    [thread.id],
  )
  const initialSmsMessageId = nullableInteger(initialSms.rows[0]?.initial_sms_message_id)

  let imported = 0
  const teamMessages = conversation.conversationMessages
    .filter((message) => Number(message.isIncoming) !== 1 && Number(message.id) !== initialSmsMessageId && message.body?.trim())
    .sort((left, right) => Number(left.id) - Number(right.id))

  for (const message of teamMessages) {
    const messageId = Number(message.id)
    const body = hostawayMessageBodyToPlainText(message.body || "")
    if (!Number.isInteger(messageId) || messageId <= 0 || !body) continue

    const existing = await query(`update guest_chat_messages set body = $3, hostaway_communication_type = $4,
      hostaway_sync_status = 'mirrored', hostaway_sync_error = null where thread_id = $1 and hostaway_message_id = $2`,
      [thread.id, messageId, body, message.communicationType || null])
    if (existing.rowCount > 0) continue

    const inserted = await query(`
      insert into guest_chat_messages (id, thread_id, author_type, body, hostaway_message_id, hostaway_communication_type, hostaway_sync_status)
      select $1, $2, 'staff', $3, $4, $5, 'mirrored'
      where not exists (select 1 from guest_chat_messages where thread_id = $2 and (hostaway_message_id = $4 or sms_fallback_message_id = $4))
    `, [randomUUID(), thread.id, body, messageId, message.communicationType || null])
    if (inserted.rowCount === 1) imported += 1
  }

  if (imported > 0) await query(`update guest_chat_threads set status = case when status in ('closed', 'spam') then status else 'waiting_on_guest' end, updated_at = now() where id = $1`, [thread.id])
  return imported
}

function buildInquiryNote(thread: GuestChatThreadDetail, havenName: string, checkIn: string, checkOut: string, datesUnspecified: boolean) {
  const messages = thread.messages.filter((message) => message.authorType === "guest").slice(-3).map((message) => message.body)
  return [
    `Website chat inquiry from ${thread.guestName}.`,
    thread.context.havenName || thread.context.listingSlug
      ? `Haven: ${thread.context.havenName || thread.context.listingSlug}`
      : `Routing haven: ${havenName} (system-assigned; guest did not select a haven)`,
    datesUnspecified ? "Stay dates: Not provided" : `Stay dates: ${thread.context.checkIn} to ${thread.context.checkOut}`,
    datesUnspecified ? `Hostaway routing dates: ${checkIn} to ${checkOut} (placeholder only; guest did not request these dates)` : null,
    thread.context.guests ? `Guests: ${thread.context.guests}` : "Guests: Not provided",
    thread.context.sourcePath ? `Source page: ${thread.context.sourcePath}` : null,
    `Intent: ${thread.intent.replaceAll("_", " ")}`,
    messages.length ? `\nRecent guest messages:\n${messages.map((message, index) => `${index + 1}. ${message}`).join("\n")}` : null,
  ].filter(Boolean).join("\n")
}

export async function convertThreadToInquiry(threadId: string) {
  assertChatAvailable()
  const thread = await getThreadForService(threadId)
  if (!thread) throw new Error("Chat thread not found")
  if (thread.hostawayReservationId) return thread

  const listingSlug = thread.context.listingSlug || GENERAL_INQUIRY_LISTING_SLUG
  const listing = getTextInquiryListing(listingSlug)
  if (!listing) throw new Error(`Listing not found for slug: ${listingSlug}`)
  const datesUnspecified = !(thread.context.checkIn && thread.context.checkOut)
  const dates = datesUnspecified
    ? await getNearestAvailableInquiryDates(listing.listingId)
    : { checkIn: thread.context.checkIn as string, checkOut: thread.context.checkOut as string }

  const claim = await query(`
    update guest_chat_threads set hostaway_link_status = 'linking', hostaway_link_attempted_at = now(), hostaway_link_error = null
    where id = $1 and hostaway_reservation_id is null and (hostaway_link_status in ('pending', 'failed') or
      (hostaway_link_status = 'linking' and hostaway_link_attempted_at < now() - interval '5 minutes')) returning id
  `, [threadId])
  if (claim.rowCount !== 1) {
    const current = await getThreadForService(threadId)
    if (current?.hostawayReservationId) return current
    throw new Error("Thread is already being linked to Hostaway")
  }

  try {
    const guest = splitGuestName(thread.guestName)
    const result = await createHostawayInquiry({
      listingId: listing.listingId,
      checkIn: dates.checkIn,
      checkOut: dates.checkOut,
      guests: thread.context.guests || 1,
      guest: { ...guest, email: thread.guestEmail, phone: thread.guestPhone },
      note: buildInquiryNote(thread, listing.name, dates.checkIn, dates.checkOut, datesUnspecified),
    })
    const reservationId = Number(Reflect.get(result, "id") || Reflect.get(result, "hostawayReservationId"))
    if (!Number.isInteger(reservationId) || reservationId <= 0) throw new Error("Hostaway did not return an inquiry ID")

    const conversation = await waitForConversationForReservation(reservationId)
    await query(`update guest_chat_threads set hostaway_reservation_id = $2, hostaway_conversation_id = $3,
      hostaway_link_status = 'linked', hostaway_link_error = null, updated_at = now() where id = $1`,
      [threadId, reservationId, conversation?.id || null])

    if (conversation?.id) {
      await sendInitialChatAcknowledgement(thread, reservationId, conversation, listing.name)
      const messages = await query<{ id: string; body: string }>(`select id, body from guest_chat_messages where thread_id = $1 and author_type = 'guest' and hostaway_message_id is null order by created_at`, [threadId])
      for (const message of messages.rows) {
        try {
          const mirrored = await addHostawayIncomingGuestMessage(conversation.id, labelHostawayGuestMessage(message.body, "webchat"))
          await setMessageSync(message.id, "mirrored", Number(mirrored.id), null)
        } catch (error) {
          await setMessageSync(message.id, "failed", null, error instanceof Error ? error.message : "Failed to mirror message")
        }
      }
    }
  } catch (error) {
    await query(`update guest_chat_threads set hostaway_link_status = 'failed', hostaway_link_error = $2 where id = $1 and hostaway_reservation_id is null`,
      [threadId, error instanceof Error ? error.message : "Failed to create Hostaway inquiry"]).catch(() => undefined)
    throw error
  }

  const updated = await getThreadForService(threadId)
  if (!updated) throw new Error("Failed to load linked chat thread")
  return updated
}

export type SmsFallbackResult =
  | { status: "disabled" | "active" | "not_linked" | "nothing_to_send" }
  | { status: "sent"; messageCount: number; smsMessageId: number }
  | { status: "failed"; messageCount: number; error: string }

export async function routeUnreadHostawayRepliesToSms(threadId: string): Promise<SmsFallbackResult> {
  assertChatAvailable()
  if (!isHostawaySmsFallbackEnabled()) return { status: "disabled" }

  const threads = await query<{ guest_phone: string; hostaway_reservation_id: number | string | null; is_webchat_active: boolean }>(`
    select guest_phone, hostaway_reservation_id,
      (webchat_closed_at is null and webchat_last_seen_at >= now() - interval '25 seconds') as is_webchat_active
    from guest_chat_threads where id = $1 limit 1
  `, [threadId])
  const thread = threads.rows[0]
  const reservationId = nullableInteger(thread?.hostaway_reservation_id)
  if (!thread?.guest_phone || !reservationId) return { status: "not_linked" }
  if (thread.is_webchat_active) return { status: "active" }

  const claimed = await query<{ id: string; body: string; created_at: string | Date }>(`
    with candidates as (
      select m.id from guest_chat_messages m join guest_chat_threads t on t.id = m.thread_id
      where m.thread_id = $1 and m.author_type = 'staff' and m.hostaway_message_id is not null
        and coalesce(m.hostaway_communication_type, '') <> 'sms'
        and m.created_at > coalesce(t.last_guest_read_at, to_timestamp(0))
        and (t.webchat_closed_at is not null or t.webchat_last_seen_at is null or t.webchat_last_seen_at < now() - interval '25 seconds')
        and m.sms_fallback_sent_at is null
        and (m.sms_fallback_status is null or (m.sms_fallback_status = 'failed' and m.sms_fallback_attempt_count < 3 and m.sms_fallback_attempted_at < now() - interval '1 minute'))
      order by m.created_at for update of m skip locked
    )
    update guest_chat_messages m set sms_fallback_status = 'sending', sms_fallback_attempt_count = sms_fallback_attempt_count + 1,
      sms_fallback_attempted_at = now(), sms_fallback_error = null from candidates c where m.id = c.id
    returning m.id, m.body, m.created_at
  `, [threadId])
  const messages = claimed.rows.sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
  if (!messages.length) return { status: "nothing_to_send" }
  const ids = messages.map((message) => message.id)
  const deliveryState = await query<{ is_webchat_active: boolean; last_guest_read_at: string | Date | null }>(`
    select (webchat_closed_at is null and webchat_last_seen_at >= now() - interval '25 seconds') as is_webchat_active,
      last_guest_read_at from guest_chat_threads where id = $1
  `, [threadId])
  const currentState = deliveryState.rows[0]
  const lastReadAt = currentState?.last_guest_read_at ? new Date(currentState.last_guest_read_at).getTime() : 0
  const hasUnreadClaimedMessages = messages.some((message) => new Date(message.created_at).getTime() > lastReadAt)
  if (currentState?.is_webchat_active || !hasUnreadClaimedMessages) {
    for (const id of ids) {
      await query(`update guest_chat_messages set sms_fallback_status = null, sms_fallback_error = null where id = $1 and sms_fallback_status = 'sending'`, [id])
    }
    return currentState?.is_webchat_active ? { status: "active" } : { status: "nothing_to_send" }
  }

  try {
    const conversation = await getConversationForReservation(reservationId)
    if (!conversation?.id) throw new Error("Hostaway conversation is not available")
    const sent = await sendHostawayConversationMessage(conversation.id, buildGuestChatFallbackSms(messages.map((message) => message.body)), "sms")
    const smsMessageId = Number(sent.id)
    if (!Number.isInteger(smsMessageId) || smsMessageId <= 0 || ["failed", "cancelled_by_user", "cancelled_by_system"].includes(sent.status || "")) {
      throw new Error("Hostaway could not send the fallback text")
    }
    for (const id of ids) {
      await query(`update guest_chat_messages set sms_fallback_status = 'sent', sms_fallback_message_id = $2,
        sms_fallback_sent_at = now(), sms_fallback_error = null where id = $1`, [id, smsMessageId])
    }
    return { status: "sent", messageCount: messages.length, smsMessageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send fallback text"
    for (const id of ids) {
      await query(`update guest_chat_messages set sms_fallback_status = 'failed', sms_fallback_error = $2 where id = $1`, [id, message]).catch(() => undefined)
    }
    return { status: "failed", messageCount: messages.length, error: message }
  }
}

export async function processHostawayChatMessageEvent(input: { reservationId?: number | null; conversationId?: number | null; messageId?: number | null }) {
  assertChatAvailable()
  let reservationId = nullableInteger(input.reservationId)
  if (!reservationId && input.conversationId) {
    const conversation = await getHostawayConversation(input.conversationId)
    reservationId = nullableInteger(conversation?.reservationId)
  }

  const linked = reservationId
    ? await query<{ id: string }>(`select id from guest_chat_threads where hostaway_reservation_id = $1 and status <> 'spam' order by updated_at desc`, [reservationId])
    : input.messageId
      ? await query<{ id: string }>(`select id from guest_chat_threads where hostaway_reservation_id is not null and status in ('waiting_on_team', 'waiting_on_guest') and updated_at >= now() - interval '60 days' order by updated_at desc limit 10`)
      : { rows: [], rowCount: 0 }

  let processed = 0
  for (const linkedThread of linked.rows) {
    const thread = await getThreadForService(linkedThread.id)
    if (!thread) continue
    await syncHostawayTeamRepliesToThread(thread)
    if (input.messageId) {
      const match = await query(`select 1 from guest_chat_messages where thread_id = $1 and (hostaway_message_id = $2 or sms_fallback_message_id = $2) limit 1`, [thread.id, input.messageId])
      if (!match.rowCount) continue
    }
    await routeUnreadHostawayRepliesToSms(thread.id)
    processed += 1
    if (!reservationId && input.messageId) break
  }
  return processed
}
