import { createHash, randomUUID } from "node:crypto"
import { db, ensureSchema, isDatabaseConfigured } from "@/lib/db"
import { sendOwnerInquiryNotification } from "@/lib/email"
import type { OwnerInquiry } from "@/lib/owner-inquiry-schema"

export class OwnerInquiryError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function deliverOwnerInquiry(input: OwnerInquiry) {
  if (!isDatabaseConfigured()) throw new OwnerInquiryError("Online inquiries are temporarily unavailable. Please call or email our team.", 503)
  await ensureSchema()
  const sql = db()
  const submissionKey = input.submissionKey || randomUUID()
  const { submissionKey: _key, website: _trap, ...details } = input
  // Reusing a submission key with different details must never return another inquiry's receipt.
  const fingerprint = createHash("sha256").update(JSON.stringify(details)).digest("hex")
  const id = randomUUID()
  const reference = `EH-OWNER-${id.slice(0, 8).toUpperCase()}`
  await sql`insert into owner_inquiries (id, submission_key, fingerprint, reference, details)
    values (${id}, ${submissionKey}, ${fingerprint}, ${reference}, ${sql.json(details)}) on conflict (submission_key) do nothing`

  return sql.begin(async (transaction) => {
    // Row locking serializes concurrent retries, including across server instances.
    const [record] = await transaction<Array<{ id: string; fingerprint: string; reference: string; delivery_status: string }>>`
      select id, fingerprint, reference, delivery_status from owner_inquiries where submission_key = ${submissionKey} for update`
    if (!record || record.fingerprint !== fingerprint) throw new OwnerInquiryError("This inquiry changed after submission. Please refresh the page and try again.", 409)
    if (record.delivery_status === "notified") return { ok: true, reference: record.reference, duplicate: true }
    const sent = await sendOwnerInquiryNotification({ ...input, reference: record.reference })
    if (!sent) throw new OwnerInquiryError("Online inquiries are temporarily unavailable. Please call or email our team.", 503)
    await transaction`update owner_inquiries set delivery_status = 'notified', updated_at = now() where id = ${record.id}`
    return { ok: true, reference: record.reference, duplicate: false }
  })
}
