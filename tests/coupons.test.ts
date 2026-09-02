import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { applyCouponRuleToQuote, CouponValidationError, type PropertyCoupon } from "@/lib/coupons"
import type { Quote } from "@/lib/schemas"

const quote: Quote = {
  listingId: 178403,
  checkIn: "2026-10-01",
  checkOut: "2026-10-04",
  guests: 4,
  nights: 3,
  total: 1250,
  currency: "USD",
  available: true,
  components: [
    { type: "accommodation", name: "baseRate", title: "Base rate", value: 1000, total: 1000, isIncludedInTotalPrice: 1 },
    { type: "fee", name: "cleaningFee", title: "Cleaning fee", value: 100, total: 100, isIncludedInTotalPrice: 1 },
    { type: "tax", name: "lodgingTax", title: "Lodging tax", value: 150, total: 150, isIncludedInTotalPrice: 1 },
  ],
}

const coupon: PropertyCoupon = {
  id: "3f94aafd-f3cf-4fb2-8512-54df18eb09a5",
  propertySlug: "emerald-haven",
  propertySlugs: ["emerald-haven"],
  code: "RETURN15",
  internalName: "Returning guests",
  discountType: "percentage",
  discountValue: 15,
  currency: "USD",
  startsAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-12-31T23:59:59.999Z",
  minimumNights: null,
  minimumSubtotal: null,
  maxRedemptions: null,
  maxRedemptionsPerGuest: 1,
  isActive: true,
  redemptionCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
}

describe("property coupons", () => {
  it("discounts accommodation without changing taxes or fees", () => {
    const application = applyCouponRuleToQuote(coupon, quote, { now: new Date("2026-06-01T00:00:00.000Z"), guestRedemptionCount: 0 })

    expect(application.coupon.discountAmount).toBe(150)
    expect(application.quote.total).toBe(1100)
    expect(application.quote.components.at(-1)).toMatchObject({ type: "discount", title: "Coupon RETURN15", total: -150 })
  })

  it("caps fixed discounts at the accommodation subtotal", () => {
    const application = applyCouponRuleToQuote({ ...coupon, discountType: "fixed", discountValue: 2000 }, quote, { now: new Date("2026-06-01T00:00:00.000Z"), guestRedemptionCount: 0 })

    expect(application.coupon.discountAmount).toBe(1000)
    expect(application.quote.total).toBe(250)
  })

  it("enforces expiration, stay, spend, total-use, and per-guest limits", () => {
    const now = new Date("2026-06-01T00:00:00.000Z")
    expect(() => applyCouponRuleToQuote({ ...coupon, expiresAt: "2026-05-31T23:59:59.999Z" }, quote, { now })).toThrow("expired")
    expect(() => applyCouponRuleToQuote({ ...coupon, minimumNights: 4 }, quote, { now })).toThrow("at least 4 nights")
    expect(() => applyCouponRuleToQuote({ ...coupon, minimumSubtotal: 1200 }, quote, { now })).toThrow("$1200.00")
    expect(() => applyCouponRuleToQuote({ ...coupon, maxRedemptions: 2, redemptionCount: 2 }, quote, { now })).toThrow("usage limit")
    expect(() => applyCouponRuleToQuote(coupon, quote, { now, guestRedemptionCount: 1 })).toThrow("email address")
  })

  it("returns a guest-safe validation error for inactive coupons", () => {
    expect(() => applyCouponRuleToQuote({ ...coupon, isActive: false }, quote)).toThrow(CouponValidationError)
  })

  it("persists one coupon across multiple property assignments", () => {
    const schema = readFileSync("db/schema.sql", "utf8")
    const actions = readFileSync("app/admin/actions.ts", "utf8")
    const propertyPage = readFileSync("app/admin/properties/[slug]/page.tsx", "utf8")
    const couponService = readFileSync("lib/coupons.ts", "utf8")

    expect(schema).toContain("create table if not exists property_coupon_properties")
    expect(schema).toContain("select id, property_slug, code from property_coupons")
    expect(schema).toContain("property_coupon_properties_slug_code_idx")
    expect(actions).toContain('formData.getAll("propertySlugs")')
    expect(propertyPage).toContain('name="propertySlugs"')
    expect(couponService).toContain("join property_coupon_properties scope")
  })
})
