import { describe, expect, it } from "vitest"
import { guestSchema, quoteRequestSchema, quoteSchema } from "@/lib/schemas"
import { formatCount, formatCurrency, nightsBetween, quoteHasChanged } from "@/lib/utils"
import { getSandboxQuote } from "@/lib/sandbox-booking"

describe("booking validation", () => {
  it("coerces valid quote requests and rejects invalid guests", () => {
    expect(quoteRequestSchema.parse({ listingId: "178403", checkIn: "2026-08-01", checkOut: "2026-08-04", guests: "4" }).guests).toBe(4)
    expect(() => quoteRequestSchema.parse({ listingId: 178403, checkIn: "2026-08-01", checkOut: "2026-08-04", guests: 0 })).toThrow()
    expect(() => quoteRequestSchema.parse({ listingId: 178403, checkIn: "2026-02-30", checkOut: "2026-03-03", guests: 2 })).toThrow()
  })

  it("requires identity and contact details without requiring website address fields", () => {
    const guest = guestSchema.parse({ firstName: "Avery", lastName: "Stone", email: "avery@example.com", phone: "2065550119" })
    expect(guest).toMatchObject({ firstName: "Avery", lastName: "Stone", phone: "+12065550119", country: "US" })
    expect(guest.address).toBeUndefined()
    expect(() => guestSchema.parse({ firstName: "Avery", lastName: "Stone", email: "avery@example.com" })).toThrow()
    expect(() => guestSchema.parse({ firstName: "Avery", lastName: "Stone", email: "avery@example.com", phone: "206-555" })).toThrow()
  })

  it("preserves Hostaway quote components", () => {
    const quote = quoteSchema.parse({ listingId: 1, checkIn: "2026-08-01", checkOut: "2026-08-03", guests: 2, nights: 2, total: 1200, currency: "USD", available: true, components: [{ type: "price", name: "baseRate", title: "Base rate", value: 1000, total: 1000 }] })
    expect(quote.components[0].name).toBe("baseRate")
    expect(nightsBetween(quote.checkIn, quote.checkOut)).toBe(2)
  })

  it("detects a material price change", () => {
    expect(quoteHasChanged({ total: 1000 }, { total: 1000.01 })).toBe(false)
    expect(quoteHasChanged({ total: 1000 }, { total: 1000.02 })).toBe(true)
  })

  it("builds a componentized sandbox quote without external services", () => {
    const quote = getSandboxQuote(178403, "2026-08-01", "2026-08-04", 4)
    expect(quote.nights).toBe(3)
    expect(quote.components.map((component) => component.name)).toEqual(["sandboxAccommodation", "sandboxCleaning", "sandboxLodgingTax"])
    expect(quote.total).toBe(quote.components.reduce((sum, component) => sum + component.total, 0))
  })

  it("keeps cents for authoritative totals and handles singular labels", () => {
    expect(formatCurrency(4138.4, "USD", { cents: true })).toBe("$4,138.40")
    expect(formatCount(1, "bath")).toBe("1 bath")
    expect(formatCount(2, "bath")).toBe("2 baths")
  })
})
