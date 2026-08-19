import { describe, expect, it } from "vitest"
import { buildInquiryHref, safeContactReturnPath } from "@/lib/contact-handoff"

describe("property inquiry handoff", () => {
  it("carries the selected stay and return position into contact", () => {
    const href = buildInquiryHref({
      property: "reflection-point",
      variant: "reflection-point",
      checkIn: "2026-09-18",
      checkOut: "2026-09-23",
      guests: 4,
      preservedQuery: "utm_source=instagram",
      returnTo: "/havens/reflection-point?checkIn=2026-09-18&checkOut=2026-09-23&guests=4#reserve",
    })

    const parsed = new URL(href, "https://enchantedhavens.com")
    expect(parsed.pathname).toBe("/contact")
    expect(Object.fromEntries(parsed.searchParams)).toMatchObject({
      property: "reflection-point",
      variant: "reflection-point",
      checkIn: "2026-09-18",
      checkOut: "2026-09-23",
      guests: "4",
      utm_source: "instagram",
      returnTo: "/havens/reflection-point?checkIn=2026-09-18&checkOut=2026-09-23&guests=4#reserve",
    })
  })

  it("accepts only local Haven return paths", () => {
    expect(safeContactReturnPath("/havens/blue-haven?guests=2#reserve", "/havens")).toBe("/havens/blue-haven?guests=2#reserve")
    expect(safeContactReturnPath("https://example.com/steal", "/havens")).toBe("/havens")
    expect(safeContactReturnPath("//example.com/steal", "/havens")).toBe("/havens")
    expect(safeContactReturnPath("/contact", "/havens")).toBe("/havens")
  })
})
