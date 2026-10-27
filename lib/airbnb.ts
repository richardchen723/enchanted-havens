import { BRAND_AIRBNB_URL } from "@/lib/brand"

export type AirbnbReviewSnapshot = {
  rating: number
  reviewCount: number
  checkedAt: string
}

const AIRBNB_LISTINGS: Record<number, { href: string; snapshot?: AirbnbReviewSnapshot }> = {
  146889: {
    href: "https://www.airbnb.com/rooms/634384398560090584",
    snapshot: { rating: 4.94, reviewCount: 210, checkedAt: "2026-10-27" },
  },
  157299: {
    href: "https://www.airbnb.com/rooms/862304966484869756",
    snapshot: { rating: 4.86, reviewCount: 116, checkedAt: "2026-10-27" },
  },
  178403: {
    href: "https://www.airbnb.com/rooms/922135705438701292",
    snapshot: { rating: 4.95, reviewCount: 132, checkedAt: "2026-10-27" },
  },
  178994: {
    href: "https://www.airbnb.com/rooms/923125727364307502",
    snapshot: { rating: 4.89, reviewCount: 137, checkedAt: "2026-10-27" },
  },
  184081: {
    href: "https://www.airbnb.com/rooms/942394610289436238",
    snapshot: { rating: 4.93, reviewCount: 119, checkedAt: "2026-10-27" },
  },
  335403: {
    href: "https://www.airbnb.com/rooms/1294876804636674762",
    snapshot: { rating: 4.88, reviewCount: 91, checkedAt: "2026-10-27" },
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
  const snapshots = [...new Set(listingIds)]
    .map((listingId) => AIRBNB_LISTINGS[listingId]?.snapshot)
    .filter((snapshot): snapshot is AirbnbReviewSnapshot => Boolean(snapshot))
  if (!snapshots.length) return null
  const reviewCount = snapshots.reduce((total, snapshot) => total + snapshot.reviewCount, 0)
  const weightedRating = snapshots.reduce((total, snapshot) => total + snapshot.rating * snapshot.reviewCount, 0) / reviewCount
  return {
    rating: Math.round(weightedRating * 100) / 100,
    reviewCount,
    href: BRAND_AIRBNB_URL,
    checkedAt: snapshots.map((snapshot) => snapshot.checkedAt).sort()[0],
  }
}

export function reviewSnapshotDate(checkedAt: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${checkedAt}T00:00:00Z`))
}
