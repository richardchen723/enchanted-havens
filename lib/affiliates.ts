import { randomUUID } from "node:crypto"
import { NextRequest } from "next/server"
import { db, ensureSchema, isDatabaseConfigured } from "@/lib/db"
import { affiliateIsEligible, affiliateSchema, applyAffiliate, REFERRAL_COOKIE, referralCodeSchema, type Affiliate, type AffiliateInput, type AffiliateSnapshot, type CommissionStatus } from "@/lib/affiliate-rules"
import type { Quote } from "@/lib/schemas"
import type { TransactionSql } from "postgres"

type AffiliateRow = {
  id: string; name: string; email: string; social_handle: string; code: string; status: Affiliate["status"]
  discount_type: Affiliate["discountType"]; discount_value: string | number
  commission_type: Affiliate["commissionType"]; commission_value: string | number
  starts_on: string | Date | null; ends_on: string | Date | null; notes: string; visits: number
}
const date = (value: string | Date | null) => value ? new Date(value).toISOString().slice(0, 10) : null
function affiliateDto(row: AffiliateRow): Affiliate {
  return {
    id: row.id, name: row.name, email: row.email, socialHandle: row.social_handle, code: row.code,
    status: row.status, discountType: row.discount_type, discountValue: Number(row.discount_value),
    commissionType: row.commission_type, commissionValue: Number(row.commission_value),
    startsOn: date(row.starts_on), endsOn: date(row.ends_on), notes: row.notes, visits: row.visits,
  }
}

export async function getActiveAffiliate(code: string) {
  const parsed = referralCodeSchema.safeParse(code)
  if (!parsed.success || !isDatabaseConfigured()) return null
  await ensureSchema()
  const rows = await db()<AffiliateRow[]>`select * from affiliates where code = ${parsed.data} limit 1`
  const affiliate = rows[0] ? affiliateDto(rows[0]) : null
  return affiliate && affiliateIsEligible(affiliate) ? affiliate : null
}

export async function applyRequestReferral(request: Request, quote: Quote, couponCode?: string) {
  // Match LR: an explicitly entered coupon wins and receives no affiliate commission.
  if (couponCode?.trim()) return { quote, snapshot: null }
  const code = new NextRequest(request.url, { headers: request.headers }).cookies.get(REFERRAL_COOKIE)?.value
  if (!code) return { quote, snapshot: null }
  const affiliate = await getActiveAffiliate(code)
  return affiliate ? applyAffiliate(quote, affiliate) : { quote, snapshot: null }
}

export async function recordReferralVisit(affiliateId: string) {
  await db()`update affiliates set visits = visits + 1 where id = ${affiliateId}`
}

export async function listAffiliates() {
  await ensureSchema()
  const rows = await db()<AffiliateRow[]>`select * from affiliates order by created_at desc`
  return rows.map(affiliateDto)
}

export async function saveAffiliate(input: AffiliateInput, actorId: string, id?: string) {
  const data = affiliateSchema.parse(input)
  await ensureSchema()
  const affiliateId = id || randomUUID()
  await db().begin(async (sql) => {
    const previous = id ? await sql<AffiliateRow[]>`select * from affiliates where id = ${id} for update` : []
    if (id && !previous[0]) throw new Error("Affiliate not found.")
    // Referral codes are permanent so old shared links cannot silently change ownership.
    if (previous[0] && previous[0].code !== data.code) throw new Error("An existing referral code cannot be changed.")
    await sql`
      insert into affiliates (id, name, email, social_handle, code, status, discount_type, discount_value,
        commission_type, commission_value, starts_on, ends_on, notes, created_by)
      values (${affiliateId}, ${data.name}, ${data.email}, ${data.socialHandle}, ${data.code}, ${data.status},
        ${data.discountType}, ${data.discountValue}, ${data.commissionType}, ${data.commissionValue},
        ${data.startsOn}, ${data.endsOn}, ${data.notes}, ${actorId})
      on conflict (id) do update set name = excluded.name, email = excluded.email, social_handle = excluded.social_handle,
        status = excluded.status, discount_type = excluded.discount_type, discount_value = excluded.discount_value,
        commission_type = excluded.commission_type, commission_value = excluded.commission_value,
        starts_on = excluded.starts_on, ends_on = excluded.ends_on, notes = excluded.notes, updated_at = now()
    `
    await sql`insert into affiliate_audit_log (id, affiliate_id, actor_id, action, changes)
      values (${randomUUID()}, ${affiliateId}, ${actorId}, ${id ? "updated" : "created"},
        ${sql.json({ before: previous[0] ? affiliateDto(previous[0]) : null, after: data } as never)})`
  })
  return affiliateId
}

// Called inside the same transaction as booking confirmation. Retries cannot duplicate commissions.
export async function recordAffiliateCommission(sql: TransactionSql, sessionId: string) {
  await sql`
    insert into affiliate_commissions (id, affiliate_id, booking_session_id, snapshot, amount)
    select ${randomUUID()}, (affiliate_snapshot->>'affiliateId')::uuid, id, affiliate_snapshot,
      (affiliate_snapshot->>'commissionAmount')::numeric
    from booking_sessions where id = ${sessionId} and status = 'confirmed'
      and affiliate_snapshot is not null and affiliate_snapshot->>'currency' = 'USD'
    on conflict (booking_session_id) do nothing
  `
}

export type AffiliateCommission = {
  id: string; affiliate_id: string; affiliate_name: string; booking_session_id: string
  hostaway_reservation_id: number; property_slug: string; check_in: string; check_out: string
  snapshot: AffiliateSnapshot; amount: string | number; status: CommissionStatus; payout_notes: string
}

export async function listAffiliateCommissions(affiliateId?: string) {
  await ensureSchema()
  return db()<AffiliateCommission[]>`
    select c.*, a.name as affiliate_name, b.hostaway_reservation_id, b.property_slug,
      b.check_in::text, b.check_out::text
    from affiliate_commissions c join affiliates a on a.id = c.affiliate_id
    join booking_sessions b on b.id = c.booking_session_id
    where (${affiliateId || null}::uuid is null or c.affiliate_id = ${affiliateId || null}::uuid)
    order by c.created_at desc
  `
}

export async function updateCommission(input: { id: string; status: CommissionStatus; amount: number; notes: string; actorId: string }) {
  await ensureSchema()
  await db().begin(async (sql) => {
    const rows = await sql<AffiliateCommission[]>`select * from affiliate_commissions where id = ${input.id} for update`
    const previous = rows[0]
    if (!previous) throw new Error("Commission not found.")
    await sql`update affiliate_commissions set status = ${input.status}, amount = ${input.amount},
      payout_notes = ${input.notes}, updated_by = ${input.actorId}, updated_at = now(),
      paid_at = case when ${input.status} = 'paid' then coalesce(paid_at, now()) else null end
      where id = ${input.id}`
    await sql`insert into affiliate_audit_log (id, affiliate_id, commission_id, actor_id, action, changes)
      values (${randomUUID()}, ${previous.affiliate_id}, ${input.id}, ${input.actorId}, 'commission-updated',
        ${sql.json({ before: { status: previous.status, amount: Number(previous.amount), notes: previous.payout_notes }, after: { status: input.status, amount: input.amount, notes: input.notes } } as never)})`
  })
}

export async function listAffiliateAudit(affiliateId: string) {
  await ensureSchema()
  return db()<Array<{ action: string; actor: string; created_at: Date; changes: unknown }>>`
    select l.action, u.full_name as actor, l.created_at, l.changes
    from affiliate_audit_log l join admin_users u on u.id = l.actor_id
    where affiliate_id = ${affiliateId} order by l.created_at desc limit 30
  `
}
