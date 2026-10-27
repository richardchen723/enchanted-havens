import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCatalog: vi.fn(),
  getHostawayQuote: vi.fn(),
  isHostawayConfigured: vi.fn(),
  getListingCalendar: vi.fn(),
}))

vi.mock("@/lib/catalog", () => ({ getCatalog: mocks.getCatalog }))
vi.mock("@/lib/hostaway", () => ({
  getHostawayQuote: mocks.getHostawayQuote,
  isHostawayConfigured: mocks.isHostawayConfigured,
  getListingCalendar: mocks.getListingCalendar,
}))

import { POST } from "@/app/api/search/route"

function searchRequest() {
  return new Request("http://localhost/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkIn: "2027-09-23", checkOut: "2027-09-29", guests: 2 }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(new Date("2026-10-27T12:00:00Z"))
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

afterEach(() => vi.useRealTimers())

const days = (available: number) => Array.from({ length: 7 }, (_, i) => ({ date: `2027-09-${23+i}`, isAvailable: available }))

describe("collection availability search", () => {
  it("does not advertise a priced listing when its Hostaway calendar is blocked", async () => {
    mocks.getListingCalendar.mockResolvedValue(days(0))

    const response = await POST(searchRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ status: "complete", results: [], unknown: [] })
    expect(mocks.getListingCalendar).toHaveBeenCalledWith(146889, "2027-09-23", "2027-09-29", expect.any(AbortSignal))
    expect(mocks.getHostawayQuote).not.toHaveBeenCalled()
  })

  it("prices and returns a listing only after its calendar passes", async () => {
    mocks.getListingCalendar.mockResolvedValue(days(1))

    const response = await POST(searchRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
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
    expect(mocks.getHostawayQuote).toHaveBeenCalledWith(146889, "2027-09-23", "2027-09-29", 2, expect.any(AbortSignal))
  })
})
