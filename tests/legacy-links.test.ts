import { describe, expect, it } from "vitest"
import { canonicalLegacyQuery, legacyListingDestination } from "@/lib/legacy-links"

describe("legacy booking link cleanup", () => {
  it("maps old listing paths to the canonical Haven routes", () => {
    expect(legacyListingDestination("/listings/146889")).toBe("/havens/blue-haven")
    expect(legacyListingDestination("/listing/558677/")).toBe("/havens/whidbey-estate/full-estate")
    expect(legacyListingDestination("/listings/576478")).toBe("/havens/reflection-point")
  })

  it("normalizes aliases, removes duplicates, and preserves attribution", () => {
    const params = new URLSearchParams("startDate=2027-04-15&endDate=2027-04-19&numberOfGuests=5&numberOfGuests=8&utm_source=linktree&utm_source=duplicate")
    const result = canonicalLegacyQuery(params, new Date("2026-08-14T12:00:00Z"))

    expect(result.toString()).toBe("checkIn=2027-04-15&checkOut=2027-04-19&guests=5&utm_source=linktree")
  })

  it("drops expired or reversed date pairs", () => {
    const expired = canonicalLegacyQuery(new URLSearchParams("checkIn=2025-01-01&checkOut=2025-01-05&guests=4"), new Date("2026-08-14T12:00:00Z"))
    const reversed = canonicalLegacyQuery(new URLSearchParams("checkIn=2027-05-10&checkOut=2027-05-08&guests=3"), new Date("2026-08-14T12:00:00Z"))

    expect(expired.toString()).toBe("guests=4")
    expect(reversed.toString()).toBe("guests=3")
  })
})
