import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCatalog: vi.fn(),
  getHostawayQuote: vi.fn(),
  isHostawayConfigured: vi.fn(),
  isListingAvailable: vi.fn(),
}))

vi.mock("@/lib/catalog", () => ({ getCatalog: mocks.getCatalog }))
vi.mock("@/lib/hostaway", () => ({
  getHostawayQuote: mocks.getHostawayQuote,
  isHostawayConfigured: mocks.isHostawayConfigured,
  isListingAvailable: mocks.isListingAvailable,
}))

import { POST } from "@/app/api/search/route"

function searchRequest() {
  return new Request("http://localhost/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkIn: "2026-09-23", checkOut: "2026-09-29", guests: 2 }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.isHostawayConfigured.mockReturnValue(true)
  mocks.getCatalog.mockResolvedValue([
    {
      slug: "blue-haven",
      variants: [{ id: 146889, slug: "blue-haven", guests: 6 }],
    },
  ])
  mocks.getHostawayQuote.mockResolvedValue({
    available: true,
    total: 6357.21,
    currency: "USD",
    nights: 6,
  })
})

describe("collection availability search", () => {
  it("does not advertise a priced listing when its Hostaway calendar is blocked", async () => {
    mocks.isListingAvailable.mockResolvedValue(false)

    const response = await POST(searchRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ results: [] })
    expect(mocks.isListingAvailable).toHaveBeenCalledWith(146889, "2026-09-23", "2026-09-29")
    expect(mocks.getHostawayQuote).not.toHaveBeenCalled()
  })

  it("prices and returns a listing only after its calendar passes", async () => {
    mocks.isListingAvailable.mockResolvedValue(true)

    const response = await POST(searchRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      results: [{
        propertySlug: "blue-haven",
        availableListingIds: [146889],
        variants: [{
          listingId: 146889,
          variantSlug: "blue-haven",
          quote: { total: 6357.21, currency: "USD", nights: 6 },
        }],
      }],
    })
    expect(mocks.getHostawayQuote).toHaveBeenCalledWith(146889, "2026-09-23", "2026-09-29", 2)
  })
})
