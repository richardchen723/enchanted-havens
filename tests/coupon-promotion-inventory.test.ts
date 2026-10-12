import { beforeEach, describe, expect, it, vi } from "vitest"

const query = vi.hoisted(() => vi.fn())
vi.mock("@/lib/db", () => ({
  db: () => query,
  ensureSchema: vi.fn(),
  isDatabaseConfigured: () => true,
}))

import { getAdvertisedCouponForPage } from "@/lib/coupons"

const row = {
  id: "offer-id", property_slug: "whidbey-estate", code: "RETURN15", internal_name: null,
  discount_type: "percentage", discount_value: 15, currency: "USD",
  starts_at: "2026-01-01", expires_at: null, minimum_nights: null, minimum_subtotal: null,
  max_redemptions: null, max_redemptions_per_guest: null, is_active: true,
  redemption_count: 0, created_at: "2026-01-01",
}

beforeEach(() => query.mockReset())

describe("public promotions use current inventory", () => {
  it("hides offers that only apply to retired properties", async () => {
    query.mockResolvedValue([{ ...row, property_slugs: ["whidbey-estate"] }])
    await expect(getAdvertisedCouponForPage("/", ["blue-haven"])).resolves.toBeNull()
  })

  it("preserves shared offers while removing retired property links", async () => {
    query.mockResolvedValue([{ ...row, property_slugs: ["whidbey-estate", "blue-haven"] }])
    await expect(getAdvertisedCouponForPage("/", ["blue-haven"])).resolves.toMatchObject({
      code: "RETURN15", offerLabel: "15% off accommodation",
      propertySlugs: ["blue-haven"], ctaHref: "/havens/blue-haven?coupon=RETURN15",
    })
  })

  it("keeps multi-home offers unchanged for the remaining collection", async () => {
    query.mockResolvedValue([{ ...row, property_slugs: ["blue-haven", "emerald-haven"] }])
    const promotion = await getAdvertisedCouponForPage("/", ["blue-haven", "emerald-haven"])
    expect(promotion?.propertySlugs).toEqual(["blue-haven", "emerald-haven"])
    const link = new URL(promotion!.ctaHref, "https://enchantedhavens.com")
    expect(link.pathname).toBe("/havens")
    expect(link.searchParams.get("matches")).toBe("blue-haven,emerald-haven")
    expect(link.searchParams.get("coupon")).toBe("RETURN15")
  })
})
