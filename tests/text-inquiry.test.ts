import { describe, expect, it } from "vitest"
import {
  buildHostawayGuestConversationMessage,
  buildHostawayInquiryNote,
  buildInitialInquiryTextMessage,
  buildInitialTextMessage,
  buildTextInquiryFingerprint,
  createTextInquirySchema,
  normalizeTextPhone,
  splitGuestName,
  validateStayDateRange,
} from "@/lib/text-inquiry"
import { getTextInquiryListing, inferTextInquiryListing, textInquiryListings } from "@/lib/text-inquiry-listings"
import { allowedListingIds } from "@/lib/editorial"

const baseDetails = {
  idempotencyKey: "a86c4b85-1f89-4b21-8a0c-7d5266517803",
  guestName: "Sarah Chen",
  guestPhone: "+15551234567",
  listingSlug: "emerald-haven",
  havenName: "Emerald Haven",
  checkIn: "2026-09-12",
  checkOut: "2026-09-15",
  guests: 2,
  message: "Is the hot tub available year-round?",
  sourcePath: "/havens/emerald-haven",
}

describe("text inquiries", () => {
  it("normalizes North American and international mobile numbers", () => {
    expect(normalizeTextPhone("(555) 123-4567", "+1")).toBe("+15551234567")
    expect(normalizeTextPhone("1 555 123 4567", "+1")).toBe("+15551234567")
    expect(normalizeTextPhone("+60 12-345 6789", "+1")).toBe("+60123456789")
    expect(normalizeTextPhone("012-345 6789", "+60")).toBe("+60123456789")
    expect(() => normalizeTextPhone("123", "+1")).toThrow(/valid mobile number/)
  })

  it("validates the payload and future date range", () => {
    expect(createTextInquirySchema.parse({ ...baseDetails, countryCallingCode: "+1", website: "" }).guests).toBe(2)
    expect(() => validateStayDateRange("2026-09-12", "2026-09-15", new Date("2026-08-17T00:00:00Z"))).not.toThrow()
    expect(() => validateStayDateRange("2026-08-16", "2026-08-18", new Date("2026-08-17T00:00:00Z"))).toThrow(/past/)
    expect(() => validateStayDateRange("2026-09-15", "2026-09-12", new Date("2026-08-17T00:00:00Z"))).toThrow(/after check-in/)
  })

  it("builds the Hostaway note, preserved guest message, and concise SMS", () => {
    expect(buildHostawayInquiryNote(baseDetails)).toContain("Haven: Emerald Haven")
    expect(buildHostawayInquiryNote(baseDetails)).toContain("Mobile phone: +15551234567")
    expect(buildHostawayGuestConversationMessage(baseDetails)).toBe("Is the hot tub available year-round?\n\n(Source: Enchanted Havens website — text-message form)")
    expect(buildHostawayGuestConversationMessage({ message: "   " })).toBeNull()

    const message = buildInitialTextMessage(baseDetails, 52652999)
    expect(message).toContain("Enchanted Havens Stay Team: Inquiry #52652999")
    expect(message).toContain("Emerald Haven, Sep 12–Sep 15")
    expect(message).toContain("Reply to continue")
    expect(message).toContain("STOP to opt out")
    expect(message.length).toBeLessThanOrEqual(160)
  })

  it("keeps general inquiry acknowledgements branded and free of stay details", () => {
    const message = buildInitialInquiryTextMessage({
      generalInquiry: true,
      havenName: "Blue Haven",
      checkIn: "2026-08-27",
      checkOut: "2026-08-31",
    }, 64918969)

    expect(message).toBe("Enchanted Havens Stay Team: Inquiry #64918969 received. Reply to continue. Msg & data rates may apply. Reply STOP to opt out.")
    expect(message).not.toContain("Blue Haven")
    expect(message).not.toContain("Aug 27")
  })

  it("builds stable fingerprints without including the display name", () => {
    const details = { ...baseDetails }
    delete (details as Partial<typeof baseDetails>).havenName
    expect(buildTextInquiryFingerprint(details)).toBe(buildTextInquiryFingerprint({ ...details }))
  })

  it("splits guest names and maps every public Hostaway listing", () => {
    expect(splitGuestName("Sarah Chen")).toEqual({ firstName: "Sarah", lastName: "Chen" })
    expect(splitGuestName("Prince")).toEqual({ firstName: "Prince", lastName: "Guest" })
    expect(textInquiryListings).toHaveLength(12)
    expect(textInquiryListings.map((listing) => listing.listingId).sort()).toEqual([...allowedListingIds].sort())
    expect(getTextInquiryListing("full-estate")?.listingId).toBe(558677)
    expect(inferTextInquiryListing("/havens/whidbey-estate/main-house")?.listingSlug).toBe("main-house")
    expect(inferTextInquiryListing("/havens/emerald-haven")?.listingSlug).toBe("emerald-haven")
  })
})
