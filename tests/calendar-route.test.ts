import { beforeEach, describe, expect, it, vi } from "vitest"
import { canSelectCheckIn, canSelectCheckOut, normalizeHostawayCalendarResult } from "@/lib/calendar"

const mocks = vi.hoisted(() => ({ getListingCalendar: vi.fn(), isHostawayConfigured: vi.fn() }))

vi.mock("next/cache", () => ({ unstable_cache: (callback: unknown) => callback }))
vi.mock("@/lib/editorial", () => ({ allowedListingIds: [146889] }))
vi.mock("@/lib/hostaway", () => mocks)

import { GET } from "@/app/api/calendar/[listingId]/route"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.isHostawayConfigured.mockReturnValue(true)
})

describe("public calendar privacy", () => {
  it("omits internal reservation identifiers while preserving blocked nights and minimum-stay boundaries", async () => {
    const reservation = { id: 12345, arrivalDate: "2026-10-14", departureDate: "2026-10-16", status: "new", guestName: "Private Guest", guestEmail: "private@example.com" }
    const rawCalendar = [
      { date: "2026-10-12", isAvailable: 1, minimumStay: 2, price: 500 },
      { date: "2026-10-13", isAvailable: 1, minimumStay: 2 },
      { date: "2026-10-14", isAvailable: 0, reservations: [reservation] },
      { date: "2026-10-15", isAvailable: 0, reservations: [reservation] },
      { date: "2026-10-16", isAvailable: 1, minimumStay: 1, reservations: [{ id: "cancelled-id", arrivalDate: "2026-10-15", departureDate: "2026-10-18", status: "cancelled" }] },
      { date: "2026-10-17", isAvailable: 1 },
    ]
    mocks.getListingCalendar.mockResolvedValue(rawCalendar)

    const response = await GET(new Request("https://www.enchantedhavens.com/api/calendar/146889?startDate=2026-10-12&endDate=2026-10-17"), { params: Promise.resolve({ listingId: "146889" }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    const serialized = JSON.stringify(body)
    expect(serialized).not.toContain('"id":')
    expect(serialized).not.toContain("12345")
    expect(serialized).not.toContain("cancelled-id")
    expect(serialized).not.toContain("guestName")
    expect(serialized).not.toContain("private@example.com")
    expect(body.source).toBe("hostaway")
    expect(body.calendar["2026-10-12"].price).toBe(500)

    const calendar = normalizeHostawayCalendarResult(body.calendar)
    expect(canSelectCheckIn(new Date("2026-10-12T00:00:00"), calendar)).toBe(true)
    expect(canSelectCheckIn(new Date("2026-10-13T00:00:00"), calendar)).toBe(false)
    expect(canSelectCheckOut(new Date("2026-10-12T00:00:00"), new Date("2026-10-14T00:00:00"), calendar)).toBe(true)
    expect(canSelectCheckOut(new Date("2026-10-12T00:00:00"), new Date("2026-10-15T00:00:00"), calendar)).toBe(false)
    expect(canSelectCheckIn(new Date("2026-10-16T00:00:00"), calendar)).toBe(true)
    expect(rawCalendar[2].reservations?.[0].id).toBe(12345)
  })
})
