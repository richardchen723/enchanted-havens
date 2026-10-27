import { describe, expect, it } from "vitest"
import { getAirbnbReviewDestination, getAirbnbReviewSummary } from "@/lib/airbnb"
import { BRAND_AIRBNB_URL } from "@/lib/brand"

describe("Airbnb review destinations", () => {
  it("builds a review-count-weighted verified collection snapshot", () => {
    expect(getAirbnbReviewSummary([146889, 157299, 178403, 178994, 184081, 335403])).toMatchObject({
      rating: 4.91,
      reviewCount: 805,
      checkedAt: "2026-10-27",
    })
  })
  it("links standalone homes to their matching Airbnb listing", () => {
    expect(getAirbnbReviewDestination(146889)).toEqual({
      href: "https://www.airbnb.com/rooms/634384398560090584",
      isListingSpecific: true,
      snapshot: {
        rating: 4.94,
        reviewCount: 210,
        checkedAt: "2026-10-27",
      },
    })

    for (const listingId of [146889, 157299, 178403, 178994, 184081, 335403]) {
      const destination = getAirbnbReviewDestination(listingId)
      expect(destination.isListingSpecific).toBe(true)
      expect(destination.snapshot?.rating).toBeGreaterThanOrEqual(4.8)
      expect(destination.snapshot?.reviewCount).toBeGreaterThan(0)
    }
  })

  it("uses the brand Airbnb profile when a residence-specific listing is unavailable", () => {
    expect(getAirbnbReviewDestination(558676)).toEqual({
      href: BRAND_AIRBNB_URL,
      isListingSpecific: false,
      snapshot: null,
    })
  })

  it("does not promote the retired Reflection Point Airbnb listing", () => {
    expect(getAirbnbReviewDestination(576478)).toEqual({
      href: BRAND_AIRBNB_URL,
      isListingSpecific: false,
      snapshot: null,
    })
  })
})
