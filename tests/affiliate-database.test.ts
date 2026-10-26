import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { db, ensureSchema } from "@/lib/db"
import { applyRequestReferral, getActiveAffiliate, listAffiliateCommissions, listAffiliateAudit, saveAffiliate, updateCommission } from "@/lib/affiliates"
import { createBookingSession, markBookingConfirmed } from "@/lib/booking-sessions"
import type { AffiliateInput } from "@/lib/affiliate-rules"
import type { Quote } from "@/lib/schemas"

const testUrl = process.env.AFFILIATE_TEST_DATABASE_URL
const actorId = randomUUID()
let affiliateId: string
let sessionId: string
const partner: AffiliateInput = {
  name: "Local Test Partner", email: "partner@example.com", socialHandle: "@example", code: `test-${randomUUID()}`,
  status: "active", discountType: "percentage", discountValue: 10, commissionType: "percentage", commissionValue: 15,
  startsOn: null, endsOn: null, notes: "Local integration test only",
}
const quote: Quote = {
  listingId: 178403, checkIn: "2027-01-10", checkOut: "2027-01-13", guests: 2, nights: 3,
  total: 1300, currency: "USD", available: true,
  components: [
    { type: "price", name: "baseRate", title: "Accommodation", value: 1000, total: 1000 },
    { type: "fee", name: "cleaning", title: "Cleaning", value: 200, total: 200 },
    { type: "tax", name: "tax", title: "Tax", value: 100, total: 100 },
  ],
}
function request() {
  return new Request("http://localhost/api/checkout/setup", { method: "POST", headers: { Cookie: `enchanted_referral=${partner.code}` }, body: "{}" })
}

describe.skipIf(!testUrl)("affiliate database integration", () => {
  beforeAll(async () => {
    const url = new URL(testUrl!)
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.startsWith("/eh_affiliate_test")) throw new Error("Use a dedicated local eh_affiliate_test database.")
    process.env.POSTGRES_URL = testUrl
    await ensureSchema()
    await db()`insert into admin_users (id, email, full_name, role, status) values (${actorId}, ${`${actorId}@example.com`}, 'Local QA Admin', 'admin', 'active')`
  })
  afterAll(async () => { await db().end() })

  it("creates a partner, audits terms, and applies the server-read cookie after JSON parsing", async () => {
    affiliateId = await saveAffiliate(partner, actorId)
    const req = request()
    await req.json()
    const result = await applyRequestReferral(req, quote)
    expect(result.quote.total).toBe(1200)
    expect(result.snapshot?.commissionAmount).toBe(150)
    expect((await listAffiliateAudit(affiliateId))[0].action).toBe("created")
    const session = await createBookingSession({
      propertySlug: "emerald-haven", variantSlug: "emerald-haven", listingId: quote.listingId,
      checkIn: quote.checkIn, checkOut: quote.checkOut, guests: 2,
      guest: { firstName: "Local", lastName: "Test", email: "guest@example.com", phone: "+12065550100", country: "US" },
      quote: result.quote, baseQuote: quote, affiliateSnapshot: result.snapshot,
      stripeCustomerId: "cus_local_test", stripeSetupIntentId: `seti_local_${randomUUID()}`,
    })
    sessionId = session.id
    expect(await listAffiliateCommissions(affiliateId)).toHaveLength(0)
  })
  it("never stacks a coupon or attributes a coupon booking", async () => {
    const result = await applyRequestReferral(request(), quote, "OTHER-COUPON")
    expect(result).toEqual({ quote, snapshot: null })
  })
  it("rejects duplicate codes and preserves already-shared codes", async () => {
    await expect(saveAffiliate(partner, actorId)).rejects.toMatchObject({ code: "23505" })
    await expect(saveAffiliate({ ...partner, code: "changed-code" }, actorId, affiliateId)).rejects.toThrow("cannot be changed")
  })
  it("stops new referrals after deactivation while preserving the checkout snapshot", async () => {
    await saveAffiliate({ ...partner, status: "inactive", commissionValue: 50 }, actorId, affiliateId)
    expect(await getActiveAffiliate(partner.code)).toBeNull()
    expect((await applyRequestReferral(request(), quote)).snapshot).toBeNull()
  })
  it("atomically records one commission even when confirmations arrive concurrently", async () => {
    const results = await Promise.all([
      markBookingConfirmed({ id: sessionId, paymentMethodId: "pm_local", reservationId: 716001 }),
      markBookingConfirmed({ id: sessionId, paymentMethodId: "pm_local", reservationId: 716001 }),
    ])
    expect(results.sort()).toEqual([false, true])
    const records = await listAffiliateCommissions(affiliateId)
    expect(records).toHaveLength(1)
    expect(Number(records[0].amount)).toBe(150)
    expect(records[0].snapshot.commissionValue).toBe(15)
    expect(records[0].status).toBe("owed")
    expect(await db()`select * from outbox_events where payload->>'sessionId' = ${sessionId}`).toHaveLength(1)
  })
  it("audits manual payout, cancellation and amount corrections without changing booked terms", async () => {
    const [commission] = await listAffiliateCommissions(affiliateId)
    await updateCommission({ id: commission.id, status: "paid", amount: 150, notes: "Local test payment reference", actorId })
    let [record] = await listAffiliateCommissions(affiliateId)
    expect(record.status).toBe("paid")
    await updateCommission({ id: commission.id, status: "cancelled", amount: 0, notes: "Cancelled stay; payment recovered (local test)", actorId })
    ;[record] = await listAffiliateCommissions(affiliateId)
    expect(record.status).toBe("cancelled")
    expect(Number(record.amount)).toBe(0)
    expect(record.snapshot.commissionAmount).toBe(150)
    expect((await listAffiliateAudit(affiliateId)).filter((entry) => entry.action === "commission-updated")).toHaveLength(2)
  })
})
