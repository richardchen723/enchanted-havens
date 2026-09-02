import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { buildCouponPromotionPageGroups, normalizeCouponPromotionPath } from "@/lib/coupon-promotion-pages"
import { getCouponOfferLabel, getCouponTermsLabel } from "@/lib/coupons"
import { fallbackProperties } from "@/lib/editorial"
import { seoLandingPages } from "@/lib/seo-pages"

describe("coupon advertising", () => {
  it("builds a unique catalog of public marketing pages", () => {
    const groups = buildCouponPromotionPageGroups(fallbackProperties)
    const paths = groups.flatMap((group) => group.pages.map((page) => page.path))

    expect(new Set(paths).size).toBe(paths.length)
    expect(paths).toContain("/")
    expect(paths).toContain("/havens")
    expect(paths).toContain(`/havens/${fallbackProperties[0].slug}`)
    expect(seoLandingPages.every((page) => paths.includes(page.path))).toBe(true)
    expect(paths.some((path) => /admin|booking|confirmation|privacy|terms/.test(path))).toBe(false)
  })

  it("normalizes paths without accepting external or oversized values", () => {
    expect(normalizeCouponPromotionPath("/havens/blue-haven/?utm_source=test")).toBe("/havens/blue-haven")
    expect(normalizeCouponPromotionPath("https://example.com/havens")).toBeNull()
    expect(normalizeCouponPromotionPath(`/${"x".repeat(301)}`)).toBeNull()
  })

  it("creates concise, guest-facing offer copy", () => {
    expect(getCouponOfferLabel({ discountType: "percentage", discountValue: 15 })).toBe("15% off accommodation")
    expect(getCouponTermsLabel({ minimumNights: 3, minimumSubtotal: 500, expiresAt: "2026-12-31T23:59:59.999Z" })).toBe("3+ nights · $500+ accommodation · Book by Dec 31, 2026")
  })

  it("stores one featured coupon per public page", () => {
    const schema = readFileSync("db/schema.sql", "utf8")
    const couponService = readFileSync("lib/coupons.ts", "utf8")

    expect(schema).toContain("create table if not exists coupon_page_promotions")
    expect(schema).toContain("page_path varchar(300) primary key")
    expect(couponService).toContain("on conflict (page_path) do update")
  })
})
