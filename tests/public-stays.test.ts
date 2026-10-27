import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ getCatalog: vi.fn(), getListingCalendar: vi.fn(), getHostawayQuote: vi.fn(), isHostawayConfigured: vi.fn() }))
vi.mock("@/lib/catalog", () => ({ getCatalog: mocks.getCatalog }))
vi.mock("@/lib/hostaway", () => ({ getListingCalendar: mocks.getListingCalendar, getHostawayQuote: mocks.getHostawayQuote, isHostawayConfigured: mocks.isHostawayConfigured }))
import { fallbackProperties } from "@/lib/editorial"
import { calendarStayStatus, checkPublicStay, agentCatalog, publicQuote, searchPublicStays } from "@/lib/public-stays"
import { agentQuote, agentSearch } from "@/lib/agent-interface"
import { agentOpenApi } from "@/lib/agent-openapi"
import type { Quote } from "@/lib/schemas"

const selection = { checkIn: "2027-04-15", checkOut: "2027-04-18", guests: 2 }
const calendar = Array.from({ length: 4 }, (_, index) => ({ date: `2027-04-${15+index}`, isAvailable: 1, minimumStay: 2 }))
const quote: Quote = { listingId: 146889, ...selection, nights: 3, currency: "USD", total: 1200, available: true, components: [{ type: "tax", name: "tax", title: "Tax", total: 100, value: 100, id: 777, listingFeeSettingId: 888, isIncludedInTotalPrice: 1 }, { type: "fee", name: "pet", title: "Pet fee", total: 100, value: 100, isIncludedInTotalPrice: 0, isMandatory: 0 }] }
let requestNumber = 0
function request(path: string, extra = "") {
  return new Request(`https://www.enchantedhavens.com/agent/${path}?checkIn=${selection.checkIn}&checkOut=${selection.checkOut}&guests=2${extra}`, { headers: { "x-forwarded-for": `test-${++requestNumber}` } })
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-27T12:00:00Z"))
  mocks.getCatalog.mockResolvedValue(fallbackProperties)
  mocks.isHostawayConfigured.mockReturnValue(true)
  mocks.getListingCalendar.mockResolvedValue(calendar)
  mocks.getHostawayQuote.mockImplementation(async (id, checkIn, checkOut, guests) => ({ ...quote, listingId: id, checkIn, checkOut, guests }))
})

afterEach(() => vi.useRealTimers())

describe("public read-only stay service", () => {
  it("distinguishes incomplete calendars, blocked dates, and arrival/departure restrictions", () => {
    expect(calendarStayStatus([], selection)).toBe("unknown")
    expect(calendarStayStatus(calendar.slice(0,2), selection)).toBe("unknown")
    expect(calendarStayStatus(calendar.map((day, i) => ({ ...day, isAvailable: i === 1 ? 0 : 1 })), selection)).toBe("unavailable")
    expect(calendarStayStatus(calendar.map((day, i) => ({ ...day, closedOnArrival: i === 0 ? 1 : 0 })), selection)).toBe("unavailable")
    expect(calendarStayStatus(calendar.map((day, i) => ({ ...day, closedOnDeparture: i === 3 ? 1 : 0 })), selection)).toBe("unavailable")
    expect(calendarStayStatus(calendar.map((day) => ({ ...day, maximumStay: 2 })), selection)).toBe("unavailable")
    expect(calendarStayStatus(calendar, selection)).toBe("available")
  })
  it("does not request a price after a blocked or unknown calendar", async () => {
    mocks.getListingCalendar.mockResolvedValueOnce([]).mockResolvedValueOnce(calendar.map((day) => ({ ...day, isAvailable: 0 })))
    expect((await checkPublicStay(146889, selection)).status).toBe("unknown")
    expect((await checkPublicStay(146889, selection)).status).toBe("unavailable")
    expect(mocks.getHostawayQuote).not.toHaveBeenCalled()
  })
  it("turns upstream failures and non-USD or nonpositive rates into unknown without leaking details", async () => {
    mocks.getListingCalendar.mockRejectedValueOnce(new Error("secret provider credential"))
    expect(JSON.stringify(await checkPublicStay(146889, selection))).not.toContain("secret")
    for (const bad of [{ currency: "MYR" }, { total: 0 }, { available: false }]) {
      mocks.getHostawayQuote.mockResolvedValueOnce({ ...quote, ...bad })
      expect((await checkPublicStay(146889, selection)).status).toBe("unknown")
    }
  })
  it("returns quote freshness and abortable read calls", async () => {
    const result = await checkPublicStay(146889, selection)
    expect(result).toMatchObject({ status: "available", quote: { total: 1200, currency: "USD" } })
    expect(Date.parse(result.expiresAt) - Date.parse(result.generatedAt)).toBe(300000)
    expect(mocks.getListingCalendar).toHaveBeenCalledWith(146889, selection.checkIn, selection.checkOut, expect.any(AbortSignal))
    expect(mocks.getHostawayQuote).toHaveBeenCalledWith(146889, selection.checkIn, selection.checkOut, 2, expect.any(AbortSignal))
  })
  it("limits search concurrency and omits homes below guest capacity", async () => {
    let active = 0, peak = 0
    mocks.getListingCalendar.mockImplementation(async () => { active++; peak=Math.max(peak,active); await new Promise(resolve => setTimeout(resolve,2)); active--; return calendar })
    const results = await searchPublicStays({ ...selection, guests: 10 })
    expect(results).toHaveLength(5)
    expect(results.some(item => item.variant.id === 146889)).toBe(false)
    expect(peak).toBeLessThanOrEqual(2)
  })
  it("publishes only the six active homes and approved public facts", async () => {
    const data = await agentCatalog()
    expect(data.propertyCount).toBe(6)
    const serialized = JSON.stringify(data)
    for (const privateField of ["streetAddress", "postalCode", "ownerConfirmation", "confirmedBy", "fullDescription", "bookingEngineUrl", "576478", "558676", "Richard Chen"]) expect(serialized).not.toContain(privateField)
    expect(data.properties.find(p => p.slug === "reflection-haven")?.location.area).toBe("Lake Dawn")
    for (const property of data.properties) {
      expect(property.currency).toBe("USD")
      expect(property.images).toHaveLength(8)
      expect(property.sourceUrl).toContain("airbnb.com/rooms/")
    }
  })
  it("redacts provider IDs while retaining included/optional fee distinctions", () => {
    const result = publicQuote(quote)
    expect(result).toMatchObject({ currency: "USD", total: 1200, inventoryHeld: false, finalPriceRevalidationRequired: true })
    expect(result.components[1]).toMatchObject({ label: "Pet fee", includedInTotal: false, mandatory: false })
    expect(JSON.stringify(result)).not.toMatch(/777|888|listingFeeSettingId/)
  })
})

describe("documented agent endpoints", () => {
  it("returns a standard USD quote and shareable handoffs without reservation/payment writes", async () => {
    const response = await agentQuote(request("quote", "&listingId=146889&utm_source=assistant"))
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(data).toMatchObject({ status: "available", listingId: 146889, selection, quote: { total: 1200, priceContext: "standard_public_rate" } })
    for (const href of [data.propertyUrl, data.bookingUrl]) {
      const u = new URL(href)
      expect(u.searchParams.get("guests")).toBe("2")
      expect(u.searchParams.get("checkIn")).toBe(selection.checkIn)
      expect(u.searchParams.get("utm_source")).toBe("assistant")
    }
    expect(new URL(data.bookingUrl).pathname).toBe("/booking/blue-haven")
  })
  it("separates unavailable and unknown HTTP outcomes", async () => {
    mocks.getListingCalendar.mockResolvedValueOnce(calendar.map(day => ({ ...day, isAvailable: 0 })))
    const unavailable = await agentQuote(request("quote", "&listingId=146889"))
    expect(unavailable.status).toBe(409)
    expect(await unavailable.json()).toMatchObject({ status: "unavailable" })
    mocks.getListingCalendar.mockRejectedValueOnce(new Error("private upstream body"))
    const unknown = await agentQuote(request("quote", "&listingId=146889"))
    expect(unknown.status).toBe(503)
    expect(await unknown.text()).not.toContain("private upstream body")
  })
  it("rejects overcapacity, retired listings, repeated fields and personal input before upstream calls", async () => {
    for (const [query, code] of [["&listingId=576478",404],["&listingId=146889&guests=7",400],["&listingId=146889&email=private",400],["&listingId=146889&checkIn=2027-04-20",400]] as const) {
      expect((await agentQuote(request("quote", query))).status).toBe(code)
    }
    const over = request("quote", "&listingId=146889")
    expect((await agentQuote(new Request(over.url.replace('guests=2','guests=7')))).status).toBe(400)
    expect(mocks.getListingCalendar).not.toHaveBeenCalled()
  })
  it("preserves unknown homes in partial results instead of treating them as unavailable", async () => {
    mocks.getListingCalendar.mockImplementation(async id => { if (id === 146889) throw new Error("timeout"); return calendar })
    const response = await agentSearch(request("search"))
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data).toMatchObject({ status: "partial", unknownCount: 1 })
    expect(data.results).toHaveLength(6)
    expect(data.results.find((r: {listingId:number}) => r.listingId === 146889)).toMatchObject({ status: "unknown" })
    mocks.getListingCalendar.mockResolvedValue([])
    expect((await agentSearch(request("search"))).status).toBe(503)
  })
  it("documents GET-only operations and all error/availability outcomes", () => {
    const spec = agentOpenApi()
    expect(spec.openapi).toBe("3.1.1")
    expect(Object.keys(spec.paths)).toEqual(["/agent/catalog","/agent/search","/agent/quote"])
    for (const route of Object.values(spec.paths)) expect(Object.keys(route)).toEqual(["get"])
    expect(spec.paths['/agent/quote'].get.responses).toHaveProperty('409')
    expect(spec.paths['/agent/quote'].get.responses).toHaveProperty('503')
  })
})
