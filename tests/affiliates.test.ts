import { describe, expect, it } from "vitest"
import { affiliateIsEligible, affiliateSchema, affiliateRevenueBasis, applyAffiliate, applyAffiliateSnapshot, referralDestination, type Affiliate } from "@/lib/affiliate-rules"
import type { Quote } from "@/lib/schemas"

export const partner: Affiliate = {
  id: "0d60019d-1d4f-4e81-b572-a51cd2f9b8bb", name: "Example Partner", email: "partner@example.com",
  socialHandle: "@example", code: "example-partner", status: "active", visits: 0,
  discountType: "percentage", discountValue: 10, commissionType: "percentage", commissionValue: 15,
  startsOn: null, endsOn: null, notes: "",
}
export const quote: Quote = {
  listingId: 178403, checkIn: "2027-01-10", checkOut: "2027-01-13", guests: 2, nights: 3,
  total: 1300, currency: "USD", available: true,
  components: [
    { type: "price", name: "baseRate", title: "Accommodation", value: 1000, total: 1000 },
    { type: "fee", name: "cleaning", title: "Cleaning", value: 200, total: 200 },
    { type: "tax", name: "tax", title: "Tax", value: 100, total: 100 },
    { type: "price", name: "deposit", title: "Excluded", value: 500, total: 500, isIncludedInTotalPrice: 0 },
  ],
}

describe("affiliate pricing rules", () => {
  it("discounts accommodation only and calculates commission on the pre-discount amount", () => {
    const result = applyAffiliate(quote, partner)
    expect(result.quote.total).toBe(1200)
    expect(result.snapshot).toMatchObject({ revenueBasis: 1000, discountAmount: 100, commissionAmount: 150, currency: "USD" })
    expect(quote.total).toBe(1300)
  })
  it("caps fixed discounts at accommodation, preserves fees, and rounds commission to cents", () => {
    const result = applyAffiliate(quote, { ...partner, discountType: "fixed", discountValue: 2000, commissionValue: 1.23 })
    expect(result.quote.total).toBe(300)
    expect(result.snapshot?.commissionAmount).toBe(12.3)
    expect(applyAffiliate(quote, { ...partner, commissionType: "fixed", commissionValue: 25.01 }).snapshot?.commissionAmount).toBe(25.01)
  })
  it("never treats an unknown subtotal as accommodation or converts non-USD quotes", () => {
    expect(affiliateRevenueBasis({ ...quote, components: [] })).toBe(0)
    expect(applyAffiliate({ ...quote, components: [] }, partner).snapshot).toBeNull()
    expect(() => applyAffiliate({ ...quote, currency: "MYR" }, partner)).toThrow("USD")
  })
  it("uses the stored terms when later admin edits change partner rates", () => {
    const result = applyAffiliate(quote, partner)
    expect(applyAffiliateSnapshot(quote, result.snapshot!).total).toBe(1200)
    expect(applyAffiliate(quote, { ...partner, discountValue: 20 }).quote.total).toBe(1100)
    expect(result.snapshot?.commissionValue).toBe(15)
  })
  it("supports commission-only partners", () => {
    const result = applyAffiliate(quote, { ...partner, discountValue: 0 })
    expect(result.quote.total).toBe(quote.total)
    expect(result.snapshot?.commissionAmount).toBe(150)
  })
  it("checks inactive, future, expired and inclusive offer dates", () => {
    const now = new Date("2026-10-26T23:00:00Z")
    expect(affiliateIsEligible({ ...partner, startsOn: "2026-10-26", endsOn: "2026-10-26" }, now)).toBe(true)
    expect(affiliateIsEligible({ ...partner, status: "inactive" }, now)).toBe(false)
    expect(affiliateIsEligible({ ...partner, startsOn: "2026-10-27" }, now)).toBe(false)
    expect(affiliateIsEligible({ ...partner, endsOn: "2026-10-25" }, now)).toBe(false)
  })
  it("rejects invalid percentages, dates and fractional cents", () => {
    for (const change of [{ commissionValue: 101 }, { discountValue: -1 }, { discountValue: 1.001 }, { startsOn: "2026-02-30" }, { startsOn: "2026-10-26", endsOn: "2026-10-25" }]) {
      expect(affiliateSchema.safeParse({ ...partner, ...change }).success).toBe(false)
    }
  })
  it("keeps referral destinations onsite", () => {
    expect(referralDestination("emerald-haven")).toBe("/havens/emerald-haven")
    for (const value of ["//evil.com", "https://evil.com", "../admin", "abc?next=bad", null]) expect(referralDestination(value)).toBe("/havens")
  })
})
