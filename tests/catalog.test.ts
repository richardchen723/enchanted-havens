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
  FULL_ESTATE_COVER_IMAGE,
  FULL_ESTATE_HERO_IMAGE,
  getEditorialVariantDescription,
  getEditorialVariantHero,
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
  it("publishes seven standalone homes plus one grouped estate", () => {
    expect(fallbackProperties).toHaveLength(8)
    expect(fallbackProperties.find((property) => property.slug === "reflection-point")?.variants[0]).toMatchObject({
      id: 576478,
      guests: 6,
      bedrooms: 3,
      bathrooms: 2,
    })
    const estate = fallbackProperties.find((property) => property.slug === "whidbey-estate")
    expect(estate?.variants.map((variant) => variant.slug).sort()).toEqual(["full-estate", "guest-house", "lighthouse", "lodge", "main-house"])
    expect(estate?.variants.find((variant) => variant.slug === "guest-house")).toMatchObject({ id: 571917, guests: 5, bedrooms: 3, bathrooms: 2 })
    expect(estate?.variants.find((variant) => variant.slug === "full-estate")?.guests).toBe(42)
  })

  it("keeps editorial slugs and images while applying live facts", () => {
    const fallback = fallbackProperties[0]
    const live = { ...fallback.variants[0], slug: "146889", guests: 8, images: ["https://example.com/live.jpg"] }
    const merged = mergeCatalogVariants([fallback], [live])
    expect(merged[0].variants[0].slug).toBe("blue-haven")
    expect(merged[0].variants[0].guests).toBe(8)
    expect(merged[0].heroImage).toBe(fallback.variants[0].images[0])
    expect(merged[0].variants[0].images).toEqual([...fallback.variants[0].images, "https://example.com/live.jpg"])
    expect(merged[0].gallery).toContain("https://example.com/live.jpg")
  })

  it("keeps concise editorial copy available for collection cards", () => {
    expect(getEditorialVariantDescription(558677)).toBe(
      "Exclusive use of the gated waterfront estate and its residences.",
    )
  })

  it("uses distinct high-resolution cover and hero photography for the full estate", () => {
    const fullEstate = fallbackProperties
      .find((property) => property.slug === "whidbey-estate")
      ?.variants.find((variant) => variant.id === 558677)

    expect(fullEstate?.images[0]).toBe(FULL_ESTATE_COVER_IMAGE)
    expect(getEditorialVariantHero(558677)).toBe(FULL_ESTATE_HERO_IMAGE)
    expect(FULL_ESTATE_COVER_IMAGE).not.toBe(FULL_ESTATE_HERO_IMAGE)
    expect(FULL_ESTATE_COVER_IMAGE).toContain("width=3840")
    expect(FULL_ESTATE_HERO_IMAGE).toContain("width=3840")
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
