import { describe, expect, it } from "vitest"
import { fallbackProperties } from "@/lib/editorial"
import { applyVerifiedPropertyFacts, confirmedStayPolicies, getVerifiedPropertyFacts, propertyFactDetails, reconcileConfirmedDescription, verifiedPropertyFacts } from "@/lib/property-facts"
import { buildPropertyJsonLd } from "@/lib/property-seo"
import { seoLandingPages } from "@/lib/seo-pages"
import { getStandoutAmenities } from "@/lib/standout-amenities"
import { getBookingTermsSummary } from "@/lib/booking-terms"

function property(slug: string) {
  return fallbackProperties.find((item) => item.slug === slug)!
}

describe("verified property facts", () => {
  it.each([
    [146889, 15, 23, 10, "Check-in 3:00 p.m.–11:00 p.m.; check-out by 10:00 a.m."],
    [157299, 16, 23, 11, "Check-in 4:00 p.m.–11:00 p.m.; check-out by 11:00 a.m."],
    [178403, 16, 23, 11, "Check-in 4:00 p.m.–11:00 p.m.; check-out by 11:00 a.m."],
    [178994, 15, 23, 10, "Check-in 3:00 p.m.–11:00 p.m.; check-out by 10:00 a.m."],
    [184081, 15, 23, 10, "Check-in 3:00 p.m.–11:00 p.m.; check-out by 10:00 a.m."],
    [335403, 16, null, 11, "Check-in from 4:00 p.m.; check-out by 11:00 a.m."],
  ] as const)("keeps listing %i arrival facts and checkout terms aligned with Airbnb", (id, checkInStart, checkInEnd, checkOut, copy) => {
    expect(getBookingTermsSummary({ id })).toMatchObject({ checkInStart, checkInEnd, checkOut })
    const facts = getVerifiedPropertyFacts(id)!
    expect(propertyFactDetails(facts)).toContainEqual({ label: "Check-in and checkout", text: `${copy} All times are local Pacific time.` })
    expect(facts.source.sections).toContain("Things to know: check-in and checkout")
  })

  it("documents sources for active inventory without restoring retired homes", () => {
    expect(verifiedPropertyFacts.map((facts) => facts.listingId).sort()).toEqual(
      fallbackProperties.flatMap((home) => home.variants.map((variant) => variant.id)).sort(),
    )
    for (const facts of verifiedPropertyFacts) {
      expect(facts.source.url).toMatch(/^https:\/\/www\.airbnb\.com\/rooms\/\d+$/)
      expect(facts.source.checkedAt).toBe("2026-10-27")
    }
    expect(getVerifiedPropertyFacts(576478)).toBeUndefined()
    expect(getVerifiedPropertyFacts(558677)).toBeUndefined()
  })

  it("keeps Lake Dawn and owner-approved capacity when stale upstream data returns", () => {
    const reflection = property("reflection-haven")
    const corrected = applyVerifiedPropertyFacts({
      ...reflection,
      eyebrow: "Lake Sutherland",
      variants: [{ ...reflection.variants[0], location: "Lake Sutherland", guests: 8, bathrooms: 1, currency: "MYR" }],
    })
    expect(corrected.eyebrow).toBe("Lake Dawn")
    expect(corrected.location).toContain("Lake Dawn")
    expect(corrected.variants[0]).toMatchObject({ location: "Lake Dawn", guests: 10, bathrooms: 2, currency: "USD" })

    const sea = property("sea-renity-haven")
    const correctedSea = applyVerifiedPropertyFacts({ ...sea, variants: [{ ...sea.variants[0], guests: 10, bathrooms: 2 }] })
    expect(correctedSea.variants[0]).toMatchObject({ guests: 12, bathrooms: 2.5 })
    expect(property("fair-haven").variants[0].bathrooms).toBe(2.5)
  })

  it("distinguishes EV outlets from supplied chargers and qualifies event labels", () => {
    for (const slug of ["emerald-haven", "aurora-haven"]) {
      const home = property(slug)
      const variant = applyVerifiedPropertyFacts({
        ...home,
        variants: [{ ...home.variants[0], amenities: ["Electric vehicle charger", "Suitable for events", "Sauna"] }],
      }).variants[0]
      const highlights = getStandoutAmenities(variant)
      expect(highlights).toContain("EV outlet — bring your own charging equipment")
      expect(highlights).not.toContain("EV charger")
      expect(highlights).not.toContain("Sauna")
      expect(highlights).not.toContain("Event-friendly")
      expect(variant.amenities).toContain(confirmedStayPolicies.eventAmenity)
    }
  })

  it("matches amenity and lake guides to confirmed homes", () => {
    const matches = (slug: string) => seoLandingPages.find((page) => page.slug === slug)!.propertySlugs.slice().sort()
    expect(matches("lake-sutherland-vacation-rentals")).toEqual(["blue-haven", "emerald-haven"])
    expect(matches("washington-hot-tub-vacation-rentals")).toEqual(["aurora-haven", "emerald-haven", "reflection-haven"])
    expect(matches("washington-sauna-vacation-rentals")).toEqual(["fair-haven"])
    expect(matches("washington-vacation-rentals-with-private-dock")).toEqual(["blue-haven", "emerald-haven", "reflection-haven"])
  })

  it("carries the same location, layout, pet, and visitor facts into property schema", () => {
    const home = property("reflection-haven")
    const facts = getVerifiedPropertyFacts(home.variants[0].id)!
    const schema = buildPropertyJsonLd({ property: home, variant: home.variants[0], reviews: [], path: `/havens/${home.slug}`, heroImage: home.heroImage })
    const lodging = schema["@graph"].find((node) => node["@type"] === "VacationRental" && "additionalProperty" in node)!
    expect(lodging).toHaveProperty("additionalProperty", expect.arrayContaining([
      { "@type": "PropertyValue", name: "Setting and water access", value: facts.waterAccess },
      { "@type": "PropertyValue", name: "Sleeping arrangements", value: facts.sleeping },
      { "@type": "PropertyValue", name: "Pets", value: confirmedStayPolicies.pets },
      { "@type": "PropertyValue", name: "Visitors and events", value: confirmedStayPolicies.events },
    ]))
    expect(propertyFactDetails(facts).some((detail) => detail.text.includes("Lake Dawn"))).toBe(true)
  })

  it("repairs only confirmed capacity sentences and preserves processing-fee terms", () => {
    const fee = "The price includes a non-refundable 5% payment-processing fee."
    const original = `The property can comfortably sleep 8 adults on one King size bed, one Queen size bed, two single beds, and two thick folding mattresses.\n${fee}`
    const corrected = reconcileConfirmedDescription(184081, original)!
    expect(corrected).not.toContain("sleep 8 adults")
    expect(corrected).toContain("Up to 10 guests")
    expect(corrected).toContain("four more sleeping spaces")
    expect(corrected.split("\n").at(-1)).toBe(fee)
    expect(reconcileConfirmedDescription(178403, fee)).toBe(fee)
    expect(reconcileConfirmedDescription(184081, undefined)).toBeUndefined()
  })

  it("does not treat toddler beds as five adult bedrooms", () => {
    const emerald = getVerifiedPropertyFacts(178403)!
    expect(emerald.bedrooms).toBe(5)
    expect(emerald.sleeping).toContain("Four rooms with adult beds")
    expect(emerald.sleeping).toContain("fifth bedroom has two toddler beds")
  })

  it("keeps owner-confirmed access distinctions and removes stale Blue Haven EV claims", () => {
    const details = (id: number) => propertyFactDetails(getVerifiedPropertyFacts(id)!).map((item) => item.text).join(" ")
    expect(details(157299)).toContain("Single-level home with no steps")
    expect(details(335403)).toContain("Three-story house; the main level has no steps")
    expect(details(184081)).toContain("including the route from parking to the entrance")
    const blue = property("blue-haven")
    const corrected = applyVerifiedPropertyFacts({ ...blue, variants: [{ ...blue.variants[0], amenities: ["Electric vehicle charger"] }] })
    expect(getStandoutAmenities(corrected.variants[0])).not.toContain("EV charger")
    expect(details(146889)).not.toMatch(/EV charging|no charger/i)
  })
})
