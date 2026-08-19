export type TextInquiryListing = {
  listingId: number
  listingSlug: string
  propertySlug: string
  propertyName: string
  name: string
  maxGuests: number
}

export const textInquiryListings: TextInquiryListing[] = [
  { listingId: 146889, listingSlug: "blue-haven", propertySlug: "blue-haven", propertyName: "Blue Haven", name: "Blue Haven", maxGuests: 6 },
  { listingId: 157299, listingSlug: "sea-renity-haven", propertySlug: "sea-renity-haven", propertyName: "Sea-Renity Haven", name: "Sea-Renity Haven", maxGuests: 12 },
  { listingId: 178403, listingSlug: "emerald-haven", propertySlug: "emerald-haven", propertyName: "Emerald Haven", name: "Emerald Haven", maxGuests: 10 },
  { listingId: 178994, listingSlug: "fair-haven", propertySlug: "fair-haven", propertyName: "Fair Haven", name: "Fair Haven", maxGuests: 10 },
  { listingId: 184081, listingSlug: "aurora-haven", propertySlug: "aurora-haven", propertyName: "Aurora Haven", name: "Aurora Haven", maxGuests: 10 },
  { listingId: 335403, listingSlug: "reflection-haven", propertySlug: "reflection-haven", propertyName: "Reflection Haven", name: "Reflection Haven", maxGuests: 10 },
  { listingId: 576478, listingSlug: "reflection-point", propertySlug: "reflection-point", propertyName: "Reflection Point", name: "Reflection Point", maxGuests: 6 },
  { listingId: 558675, listingSlug: "lighthouse", propertySlug: "whidbey-estate", propertyName: "The Cove Club", name: "The Lighthouse", maxGuests: 3 },
  { listingId: 571917, listingSlug: "guest-house", propertySlug: "whidbey-estate", propertyName: "The Cove Club", name: "The Guest House", maxGuests: 5 },
  { listingId: 558676, listingSlug: "lodge", propertySlug: "whidbey-estate", propertyName: "The Cove Club", name: "The Lodge", maxGuests: 16 },
  { listingId: 558677, listingSlug: "full-estate", propertySlug: "whidbey-estate", propertyName: "The Cove Club", name: "The Full Estate", maxGuests: 42 },
  { listingId: 558678, listingSlug: "main-house", propertySlug: "whidbey-estate", propertyName: "The Cove Club", name: "The Main House", maxGuests: 12 },
]

export function getTextInquiryListing(listingSlug: string) {
  return textInquiryListings.find((listing) => listing.listingSlug === listingSlug)
}

export function inferTextInquiryListing(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  const propertySegment = segments[0] === "havens" || segments[0] === "stays" ? segments[1] : ""
  const variantSegment = segments[0] === "havens" ? segments[2] : ""

  if (variantSegment) {
    const variant = getTextInquiryListing(variantSegment)
    if (variant?.propertySlug === propertySegment) return variant
  }

  return textInquiryListings.find((listing) => listing.propertySlug === propertySegment)
}
