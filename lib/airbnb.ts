import { BRAND_AIRBNB_URL } from "@/lib/brand"

export type AirbnbReviewSnapshot = {
  rating: number
  reviewCount: number
  mentions: string[]
  checkedAt: string
}

const AIRBNB_LISTINGS: Record<number, { href: string; snapshot?: AirbnbReviewSnapshot }> = {
  146889: {
    href: "https://www.airbnb.com/rooms/634384398560090584",
    snapshot: { rating: 4.95, reviewCount: 202, mentions: ["Location", "Views", "Hospitality"], checkedAt: "August 2026" },
  },
  157299: {
    href: "https://www.airbnb.com/rooms/862304966484869756",
    snapshot: { rating: 4.85, reviewCount: 109, mentions: ["Views", "Backyard", "Beach"], checkedAt: "August 2026" },
  },
  178403: {
    href: "https://www.airbnb.com/rooms/922135705438701292",
    snapshot: { rating: 4.97, reviewCount: 122, mentions: ["Views", "Families", "Location"], checkedAt: "August 2026" },
  },
  178994: {
    href: "https://www.airbnb.com/rooms/923125727364307502",
    snapshot: { rating: 4.89, reviewCount: 132, mentions: ["Views", "Beach", "Families"], checkedAt: "August 2026" },
  },
  184081: {
    href: "https://www.airbnb.com/rooms/942394610289436238",
    snapshot: { rating: 4.93, reviewCount: 105, mentions: ["Views", "Families", "Hospitality"], checkedAt: "August 2026" },
  },
  335403: {
    href: "https://www.airbnb.com/rooms/1294876804636674762",
    snapshot: { rating: 4.88, reviewCount: 82, mentions: ["Location", "Hot tub", "Comfort"], checkedAt: "August 2026" },
  },
  576478: {
    href: "https://www.airbnb.com/rooms/1718464591834030571",
  },
}

export function getAirbnbReviewDestination(listingId: number) {
  const listing = AIRBNB_LISTINGS[listingId]

  return {
    href: listing?.href || BRAND_AIRBNB_URL,
    isListingSpecific: Boolean(listing),
    snapshot: listing?.snapshot || null,
  }
}

export function getAirbnbReviewSummary(listingIds: number[]) {
  const snapshots = listingIds
    .map((listingId) => AIRBNB_LISTINGS[listingId]?.snapshot)
    .filter((snapshot): snapshot is AirbnbReviewSnapshot => Boolean(snapshot))
  if (!snapshots.length) return null
  const reviewCount = snapshots.reduce((total, snapshot) => total + snapshot.reviewCount, 0)
  const weightedRating = snapshots.reduce((total, snapshot) => total + snapshot.rating * snapshot.reviewCount, 0) / reviewCount
  return {
    rating: Math.round(weightedRating * 100) / 100,
    reviewCount,
    href: BRAND_AIRBNB_URL,
    checkedAt: snapshots[0].checkedAt,
  }
}
