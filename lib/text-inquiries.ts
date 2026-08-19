import { randomUUID } from "node:crypto"
import { db, ensureSchema } from "@/lib/db"

export type TextInquiryStatus = "pending" | "ready" | "failed"

export type TextInquiryRecord = {
  id: string
  idempotencyKey: string
  requestFingerprint: string
  guestName: string
  guestPhone: string
  listingSlug: string
  checkIn: string
  checkOut: string
  guests: number
  message: string
  sourcePath: string
  status: TextInquiryStatus
  hostawayReservationId: number | null
  hostawayConversationId: number | null
  smsMessageId: number | null
  smsStatus: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

type TextInquiryRow = {
  id: string
  idempotency_key: string
  request_fingerprint: string
  guest_name: string
  guest_phone: string
  listing_slug: string
  check_in: string | Date
  check_out: string | Date
  guests: number | string
  message: string
  source_path: string
  status: TextInquiryStatus
  hostaway_reservation_id: number | string | null
  hostaway_conversation_id: number | string | null
  sms_message_id: number | string | null
  sms_status: string | null
  error_message: string | null
  created_at: string | Date
  updated_at: string | Date
}

type CreateTextInquiryRecordInput = {
  idempotencyKey: string
  requestFingerprint: string
  clientIpHash: string
  guestName: string
  guestPhone: string
  listingSlug: string
  checkIn: string
  checkOut: string
  guests: number
  message: string
  sourcePath: string
}

function formatDatabaseDate(value: string | Date) {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10)
}

function mapTextInquiry(row: TextInquiryRow): TextInquiryRecord {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    requestFingerprint: row.request_fingerprint,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    listingSlug: row.listing_slug,
    checkIn: formatDatabaseDate(row.check_in),
    checkOut: formatDatabaseDate(row.check_out),
    guests: Number(row.guests),
    message: row.message,
    sourcePath: row.source_path,
    status: row.status,
    hostawayReservationId: row.hostaway_reservation_id === null ? null : Number(row.hostaway_reservation_id),
    hostawayConversationId: row.hostaway_conversation_id === null ? null : Number(row.hostaway_conversation_id),
    smsMessageId: row.sms_message_id === null ? null : Number(row.sms_message_id),
    smsStatus: row.sms_status,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function getTextInquiryByIdempotencyKey(idempotencyKey: string) {
  await ensureSchema()
  const rows = await db()<TextInquiryRow[]>`
    select * from website_text_inquiries where idempotency_key = ${idempotencyKey} limit 1
  `
  return rows[0] ? mapTextInquiry(rows[0]) : null
}

export async function createTextInquiryRecord(input: CreateTextInquiryRecordInput) {
  await ensureSchema()
  const rows = await db()<TextInquiryRow[]>`
    insert into website_text_inquiries (
      id, idempotency_key, request_fingerprint, client_ip_hash, guest_name, guest_phone,
      listing_slug, check_in, check_out, guests, message, source_path, status
    ) values (
      ${randomUUID()}, ${input.idempotencyKey}, ${input.requestFingerprint}, ${input.clientIpHash},
      ${input.guestName}, ${input.guestPhone}, ${input.listingSlug}, ${input.checkIn}, ${input.checkOut},
      ${input.guests}, ${input.message}, ${input.sourcePath}, 'pending'
    )
    on conflict (idempotency_key) do nothing
    returning *
  `

  if (rows[0]) return { record: mapTextInquiry(rows[0]), created: true }
  const existing = await getTextInquiryByIdempotencyKey(input.idempotencyKey)
  if (!existing) throw new Error("Failed to reserve text inquiry")
  return { record: existing, created: false }
}

export async function retryFailedTextInquiry(id: string) {
  await ensureSchema()
  const rows = await db()<Array<{ id: string }>>`
    update website_text_inquiries
    set status = 'pending', error_message = null, updated_at = now()
    where id = ${id} and status = 'failed'
    returning id
  `
  return rows.length === 1
}

export async function countRecentTextInquiryAttempts(guestPhone: string, clientIpHash: string) {
  await ensureSchema()
  const rows = await db()<Array<{ attempt_count: number | string }>>`
    select count(*) as attempt_count
    from website_text_inquiries
    where created_at > now() - interval '1 hour'
      and (guest_phone = ${guestPhone} or client_ip_hash = ${clientIpHash})
  `
  return Number(rows[0]?.attempt_count || 0)
}

export async function markTextInquiryHostawayCreated(id: string, hostawayReservationId: number) {
  await ensureSchema()
  await db()`
    update website_text_inquiries
    set hostaway_reservation_id = ${hostawayReservationId}, updated_at = now()
    where id = ${id}
  `
}

export async function markTextInquiryReady(
  id: string,
  hostawayReservationId: number,
  hostawayConversationId: number,
  smsMessageId: number,
  smsStatus: string | null,
) {
  await ensureSchema()
  await db()`
    update website_text_inquiries
    set status = 'ready', hostaway_reservation_id = ${hostawayReservationId},
      hostaway_conversation_id = ${hostawayConversationId}, sms_message_id = ${smsMessageId},
      sms_status = ${smsStatus}, error_message = null, updated_at = now()
    where id = ${id}
  `
}

export async function markTextInquiryFailed(id: string, errorMessage: string) {
  await ensureSchema()
  await db()`
    update website_text_inquiries
    set status = 'failed', error_message = ${errorMessage.slice(0, 1000)}, updated_at = now()
    where id = ${id}
  `
}
