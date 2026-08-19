import { randomUUID } from "node:crypto"
import { after } from "next/server"
import { ZodError } from "zod"
import { contactSchema } from "@/lib/schemas"
import { db, ensureSchema, isDatabaseConfigured } from "@/lib/db"
import { sendContactAcknowledgement, sendContactNotification } from "@/lib/email"

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 5
const inquiryAttempts = new Map<string, number[]>()

function requestKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

function isRateLimited(key: string) {
  const now = Date.now()
  const active = (inquiryAttempts.get(key) || []).filter((attempt) => now - attempt < RATE_LIMIT_WINDOW_MS)
  if (active.length >= RATE_LIMIT_MAX) return true
  active.push(now)
  inquiryAttempts.set(key, active)
  return false
}

export async function POST(request: Request) {
  try {
    if (isRateLimited(requestKey(request))) {
      return Response.json({ error: "Too many inquiries were submitted from this connection. Please wait a few minutes and try again." }, { status: 429 })
    }
    const input = contactSchema.parse(await request.json())
    const submissionKey = input.submissionKey || randomUUID()
    let id: string = randomUUID()
    let reference = `EH-${id.slice(0, 8).toUpperCase()}`
    let deliveryStatus = "new"
    let acknowledgementSent = false
    if (isDatabaseConfigured()) {
      await ensureSchema()
      const existing = await db()<Array<{ id: string; reference: string; delivery_status: string; acknowledgement_sent_at: string | null }>>`
        select id, reference, delivery_status, acknowledgement_sent_at from contact_inquiries where submission_key = ${submissionKey} limit 1
      `
      if (existing[0]) {
        id = existing[0].id
        reference = existing[0].reference
        deliveryStatus = existing[0].delivery_status
        acknowledgementSent = Boolean(existing[0].acknowledgement_sent_at)
      } else {
        await db()`insert into contact_inquiries (id, submission_key, reference, name, email, phone, trip_type, message, delivery_status) values (${id}, ${submissionKey}, ${reference}, ${input.name}, ${input.email}, ${input.phone || null}, ${input.tripType || null}, ${input.message}, 'stored')`
        deliveryStatus = "stored"
      }
    }
    const scheduleAcknowledgement = () => after(async () => {
      try {
        const acknowledged = await sendContactAcknowledgement({ ...input, reference })
        if (acknowledged && isDatabaseConfigured()) await db()`update contact_inquiries set acknowledgement_sent_at = now(), updated_at = now() where id = ${id}`
      } catch (error) {
        console.error("Unable to send contact acknowledgement", error)
      }
    })
    if (deliveryStatus === "notified") {
      if (!acknowledgementSent) scheduleAcknowledgement()
      return Response.json({ ok: true, reference, duplicate: true })
    }
    let notificationSent = false
    try {
      notificationSent = await sendContactNotification({ ...input, reference })
    } catch (error) {
      if (isDatabaseConfigured()) await db()`update contact_inquiries set delivery_status = 'failed', updated_at = now() where id = ${id}`
      throw error
    }
    if (!notificationSent) {
      if (isDatabaseConfigured()) await db()`update contact_inquiries set delivery_status = 'awaiting_configuration', updated_at = now() where id = ${id}`
      return Response.json({ error: "Contact delivery is being configured. Please try again shortly." }, { status: 503 })
    }
    if (isDatabaseConfigured()) {
      await db()`update contact_inquiries set delivery_status = 'notified', updated_at = now() where id = ${id}`
    }
    scheduleAcknowledgement()
    return Response.json({ ok: true, reference })
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: "Please check the required details and try again." }, { status: 400 })
    console.error("Unable to send contact inquiry", error)
    return Response.json({ error: "We could not send your inquiry. Please try again shortly." }, { status: 500 })
  }
}
