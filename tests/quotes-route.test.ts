import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getHostawayQuote: vi.fn(async () => ({
    listingId: 178403,
    checkIn: "2026-06-30",
    checkOut: "2026-07-03",
    guests: 2,
    nights: 3,
    total: 5010.74,
    currency: "USD",
    available: true,
    components: [],
  })),
  getSandboxQuote: vi.fn(() => {
    throw new Error("Sandbox pricing must not replace a configured Hostaway quote")
  }),
}))

vi.mock("@/lib/hostaway", () => ({
  getHostawayQuote: mocks.getHostawayQuote,
  isHostawayConfigured: () => true,
  isListingAvailable: async () => true,
}))

vi.mock("@/lib/sandbox-booking", () => ({
  getSandboxQuote: mocks.getSandboxQuote,
  isSandboxBooking: () => true,
}))

import { POST } from "@/app/api/quotes/route"

describe("quote API", () => {
  it("uses live Hostaway pricing when reservation writes are sandboxed", async () => {
    const response = await POST(new Request("http://localhost/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: 178403, checkIn: "2026-06-30", checkOut: "2026-07-03", guests: 2 }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({ source: "hostaway", sandboxWrites: true, quote: { total: 5010.74 } })
    expect(mocks.getHostawayQuote).toHaveBeenCalledWith(178403, "2026-06-30", "2026-07-03", 2)
    expect(mocks.getSandboxQuote).not.toHaveBeenCalled()
  })
})
