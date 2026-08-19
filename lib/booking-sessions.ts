import { randomUUID } from "node:crypto"
import { db, ensureSchema } from "@/lib/db"
import type { Guest, Quote } from "@/lib/schemas"

export const TERMS_VERSION = "2026-06-13-v1"

export type BookingSessionRow = {
  id: string
  status: string
  property_slug: string
  variant_slug: string
  listing_id: number
  check_in: string
  check_out: string
  guests: number
  guest: Guest
  quote: Quote
  stripe_customer_id: string | null
  stripe_setup_intent_id: string | null
  stripe_payment_method_id: string | null
  hostaway_reservation_id: number | null
  consent_at: string | null
  terms_version: string | null
  error: string | null
  expires_at: string
  confirmed_at: string | null
  updated_at: string
}

type RawBookingSessionRow = Omit<
  BookingSessionRow,
  "check_in" | "check_out" | "consent_at" | "expires_at" | "confirmed_at" | "updated_at"
> & {
  check_in: string | Date
  check_out: string | Date
  consent_at: string | Date | null
  expires_at: string | Date
  confirmed_at: string | Date | null
  updated_at: string | Date
}

function dateOnly(value: string | Date) {
  const serialized = value instanceof Date ? value.toISOString() : value
  const match = /^\d{4}-\d{2}-\d{2}/.exec(serialized)
  if (!match) throw new Error(`Invalid booking date: ${serialized}`)
  return match[0]
}

function timestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value
}

export function normalizeBookingSessionRow(row: RawBookingSessionRow): BookingSessionRow {
  return {
    ...row,
    check_in: dateOnly(row.check_in),
    check_out: dateOnly(row.check_out),
    consent_at: row.consent_at ? timestamp(row.consent_at) : null,
    expires_at: timestamp(row.expires_at),
    confirmed_at: row.confirmed_at ? timestamp(row.confirmed_at) : null,
    updated_at: timestamp(row.updated_at),
  }
}

export async function createBookingSession(input: {
  propertySlug: string
  variantSlug: string
  listingId: number
  checkIn: string
  checkOut: string
  guests: number
  guest: Guest
  quote: Quote
  stripeCustomerId: string
  stripeSetupIntentId: string
}) {
  await ensureSchema()
  const id = randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60_000)
  await db()`
    insert into booking_sessions (
      id, status, property_slug, variant_slug, listing_id, check_in, check_out, guests,
      guest, quote, stripe_customer_id, stripe_setup_intent_id, expires_at
    ) values (
      ${id}, 'pending', ${input.propertySlug}, ${input.variantSlug}, ${input.listingId},
      ${input.checkIn}, ${input.checkOut}, ${input.guests}, ${db().json(input.guest as never)},
      ${db().json(input.quote as never)}, ${input.stripeCustomerId}, ${input.stripeSetupIntentId}, ${expiresAt}
    )
  `
  return { id, expiresAt }
}

export async function getBookingSession(id: string) {
  await ensureSchema()
  const rows = await db()<RawBookingSessionRow[]>`select * from booking_sessions where id = ${id} limit 1`
  return rows[0] ? normalizeBookingSessionRow(rows[0]) : null
}

export async function beginConfirmation(id: string) {
  await ensureSchema()
  const rows = await db()<RawBookingSessionRow[]>`
    update booking_sessions
    set status = 'processing', updated_at = now()
    where id = ${id} and status = 'pending'
    returning *
  `
  return rows[0] ? normalizeBookingSessionRow(rows[0]) : null
}

export async function markBookingConfirmed(input: { id: string; paymentMethodId: string; reservationId: number }) {
  await ensureSchema()
  const sql = db()
  return sql.begin(async (transaction) => {
    const rows = await transaction<{ id: string }[]>`
      update booking_sessions set
        status = 'confirmed', stripe_payment_method_id = ${input.paymentMethodId},
        hostaway_reservation_id = ${input.reservationId}, consent_at = now(),
        terms_version = ${TERMS_VERSION}, confirmed_at = now(), updated_at = now()
      where id = ${input.id} and status <> 'confirmed'
      returning id
    `
    if (!rows[0]) return false
    await transaction`
      insert into outbox_events (id, topic, payload)
      values (${randomUUID()}, 'booking.confirmed', ${transaction.json({ sessionId: input.id, reservationId: input.reservationId } as never)})
    `
    return true
  })
}

export async function markBookingError(id: string, status: "pending" | "reconciliation_required" | "failed", error: string) {
  await ensureSchema()
  await db()`update booking_sessions set status = ${status}, error = ${error.slice(0, 1000)}, updated_at = now() where id = ${id}`
}
