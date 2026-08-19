import { describe, expect, it } from "vitest"
import { fallbackProperties } from "@/lib/editorial"
import type { PropertyVariant } from "@/lib/schemas"
import { getStandoutAmenities } from "@/lib/standout-amenities"

function variant(input: Partial<PropertyVariant>): PropertyVariant {
  return {
    id: 1,
    slug: "test-haven",
    name: "Test Haven",
    shortName: "Test Haven",
    description: "",
    location: "Washington",
    city: "Seattle",
    region: "Washington",
    guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    images: ["/images/test.jpg"],
    amenities: [],
    reviewsCount: 0,
    currency: "USD",
    ...input,
  }
}

describe("standout amenity selection", () => {
  it("prioritizes differentiators over routine supplies", () => {
    const selected = getStandoutAmenities(variant({
      amenities: ["Smoke alarm", "Wireless internet", "Private dock", "Kayak canoe", "Waterfront", "Outdoor kitchen", "Fire pit"],
    }))

    expect(selected).toEqual(["Private dock", "Outdoor kitchen", "Kayaks", "Waterfront", "Fire pit"])
  })

  it("can retain distinctive title features when Hostaway's amenity taxonomy omits them", () => {
    const selected = getStandoutAmenities(variant({
      name: "Aurora Haven: View, Hottub, Zipline, Game room",
      amenities: ["Jacuzzi", "Electric vehicle charger", "Fire pit"],
    }))

    expect(selected).toEqual(expect.arrayContaining(["Zipline", "Game room", "EV charger", "Hot tub", "Fire pit"]))
  })

  it("keeps every fallback residence capable of showing useful highlights", () => {
    for (const property of fallbackProperties) {
      for (const residence of property.variants) {
        expect(getStandoutAmenities(residence).length, `${property.slug}/${residence.shortName}`).toBeGreaterThan(0)
      }
    }
  })
})
