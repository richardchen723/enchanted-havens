import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getLatestCatalogSnapshot: vi.fn(),
  getHostawayListing: vi.fn(),
  getHostawayReviews: vi.fn(),
  getListingMapId: vi.fn(),
  saveCatalogSnapshot: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  getLatestCatalogSnapshot: mocks.getLatestCatalogSnapshot,
  saveCatalogSnapshot: mocks.saveCatalogSnapshot,
}))

vi.mock("@/lib/hostaway", () => ({
  getHostawayListing: mocks.getHostawayListing,
  getHostawayReviews: mocks.getHostawayReviews,
  getListingMapId: mocks.getListingMapId,
  isHostawayConfigured: () =>
    Boolean(
      process.env.HOSTAWAY_ACCESS_TOKEN ||
        (process.env.HOSTAWAY_CLIENT_ID && process.env.HOSTAWAY_CLIENT_SECRET),
    ),
}))

import {
  fallbackProperties,
  featuredReviews,
  getEditorialVariantDescription,
} from "@/lib/editorial"
import { bookingIsLiveFor, getCatalog, getFeaturedReviews, mergeCatalogVariants } from "@/lib/catalog"

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = { ...originalEnv }
})

describe("curated inventory", () => {
  it("publishes six standalone homes", () => {
    expect(fallbackProperties).toHaveLength(6)
    expect(fallbackProperties.some((property) => property.slug === "reflection-point")).toBe(false)
    expect(fallbackProperties.some((property) => property.slug === "reflection-haven")).toBe(true)
    expect(fallbackProperties.every((property) => !property.estate)).toBe(true)
  })

  it("keeps verified capacity and editorial identity while refreshing live images", () => {
    const fallback = fallbackProperties[0]
    const live = { ...fallback.variants[0], slug: "146889", guests: 8, images: ["https://example.com/live.jpg"] }
    const merged = mergeCatalogVariants([fallback], [live])
    expect(merged[0].variants[0].slug).toBe("blue-haven")
    expect(merged[0].variants[0].guests).toBe(6)
    expect(merged[0].heroImage).toBe(fallback.variants[0].images[0])
    expect(merged[0].variants[0].images).toEqual([...fallback.variants[0].images, "https://example.com/live.jpg"])
    expect(merged[0].gallery).toContain("https://example.com/live.jpg")
  })

  it("keeps concise editorial copy available for collection cards", () => {
    expect(getEditorialVariantDescription(146889)).toBe(
      "A photogenic lakefront cabin with private beach access and panoramic Olympic Peninsula views.",
    )
  })

  it("keeps sandbox checkout private unless it is explicitly enabled", () => {
    process.env.BOOKING_WRITE_MODE = "sandbox"
    process.env.HOSTAWAY_ACCESS_TOKEN = "configured"
    process.env.STRIPE_SECRET_KEY = "sk_test_configured"
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_configured"
    process.env.POSTGRES_URL = "postgres://configured"

    expect(bookingIsLiveFor(146889)).toBe(false)
  })

  it("enables the isolated checkout journey when sandbox access is explicit", () => {
    process.env.BOOKING_WRITE_MODE = "sandbox"
    process.env.ALLOW_SANDBOX_CHECKOUT = "true"
    process.env.STRIPE_SECRET_KEY = "sk_test_configured"
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_configured"

    expect(bookingIsLiveFor(146889)).toBe(true)
  })

  it("allows staging writes only for the allowlisted listing with test Stripe, storage, and email configured", () => {
    process.env.BOOKING_WRITE_MODE = "staging"
    process.env.BOOKING_STAGING_LISTING_ID = "157299"
    process.env.HOSTAWAY_ACCESS_TOKEN = "configured"
    process.env.STRIPE_SECRET_KEY = "sk_test_configured"
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_configured"
    process.env.POSTGRES_URL = "postgres://configured"
    process.env.GMAIL_USER = "sender@example.com"
    process.env.GMAIL_APP_PASSWORD = "configured"

    expect(bookingIsLiveFor(157299)).toBe(true)
    expect(bookingIsLiveFor(178403)).toBe(false)
  })

  it("fails staging closed when Gmail delivery is not configured", () => {
    process.env.BOOKING_WRITE_MODE = "staging"
    process.env.BOOKING_STAGING_LISTING_ID = "157299"
    process.env.HOSTAWAY_ACCESS_TOKEN = "configured"
    process.env.STRIPE_SECRET_KEY = "sk_test_configured"
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_configured"
    process.env.POSTGRES_URL = "postgres://configured"
    delete process.env.GMAIL_USER
    delete process.env.GMAIL_APP_PASSWORD

    expect(bookingIsLiveFor(157299)).toBe(false)
  })

  it("requires live Stripe keys before enabling unrestricted live writes", () => {
    process.env.BOOKING_WRITE_MODE = "live"
    process.env.HOSTAWAY_ACCESS_TOKEN = "configured"
    process.env.POSTGRES_URL = "postgres://configured"
    process.env.GMAIL_USER = "sender@example.com"
    process.env.GMAIL_APP_PASSWORD = "configured"
    process.env.STRIPE_SECRET_KEY = "sk_test_configured"
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_configured"

    expect(bookingIsLiveFor(157299)).toBe(false)

    process.env.STRIPE_SECRET_KEY = "sk_live_configured"
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_live_configured"
    expect(bookingIsLiveFor(157299)).toBe(true)

    process.env.STRIPE_SECRET_KEY = "rk_live_configured"
    expect(bookingIsLiveFor(157299)).toBe(true)
  })
})

describe("build-time catalog reads", () => {
  it("uses the latest snapshot and avoids Hostaway refreshes during production builds", async () => {
    process.env.NEXT_PHASE = "phase-production-build"
    process.env.HOSTAWAY_ACCESS_TOKEN = "configured"
    mocks.getLatestCatalogSnapshot.mockResolvedValueOnce(fallbackProperties)

    await expect(getCatalog()).resolves.toEqual(fallbackProperties)
    await expect(getFeaturedReviews()).resolves.toEqual(featuredReviews)

    expect(mocks.getLatestCatalogSnapshot).toHaveBeenCalledTimes(1)
    expect(mocks.getHostawayListing).not.toHaveBeenCalled()
    expect(mocks.getListingMapId).not.toHaveBeenCalled()
    expect(mocks.getHostawayReviews).not.toHaveBeenCalled()
    expect(mocks.saveCatalogSnapshot).not.toHaveBeenCalled()
  })

  it("uses the curated catalog during production builds when no snapshot exists", async () => {
    process.env.NEXT_PHASE = "phase-production-build"
    process.env.HOSTAWAY_ACCESS_TOKEN = "configured"
    mocks.getLatestCatalogSnapshot.mockResolvedValueOnce(null)

    await expect(getCatalog()).resolves.toEqual(fallbackProperties)

    expect(mocks.getLatestCatalogSnapshot).toHaveBeenCalledTimes(1)
    expect(mocks.getHostawayListing).not.toHaveBeenCalled()
  })
})

describe("retired inventory", () => {
  it.each([
    ["whidbey-estate", "The Cove Club", 558677],
    ["reflection-point", "Reflection Point", 576478],
  ])("does not resurrect %s from a saved catalog snapshot", async (slug, displayName, id) => {
    process.env.NEXT_PHASE = "phase-production-build"
    const retired = {
      ...fallbackProperties[0],
      slug,
      displayName,
      variants: [{ ...fallbackProperties[0].variants[0], id, slug }],
    }
    mocks.getLatestCatalogSnapshot.mockResolvedValueOnce([...fallbackProperties, retired])

    await expect(getCatalog()).resolves.toEqual(fallbackProperties)
  })

  it("never enables checkout for retired listings, including sandbox mode", () => {
    process.env.BOOKING_WRITE_MODE = "sandbox"
    process.env.ALLOW_SANDBOX_CHECKOUT = "true"
    process.env.STRIPE_SECRET_KEY = "sk_test_configured"
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_configured"

    for (const id of [558675, 558676, 558677, 558678, 571917, 576478]) {
      expect(bookingIsLiveFor(id)).toBe(false)
    }
  })
})
