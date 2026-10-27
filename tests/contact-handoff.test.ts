import { describe, expect, it } from "vitest"
import { buildInquiryHref, safeContactReturnPath } from "@/lib/contact-handoff"

describe("property inquiry handoff", () => {
  it("carries the selected stay and return position into contact", () => {
    const href = buildInquiryHref({
      property: "blue-haven",
      variant: "blue-haven",
      checkIn: "2026-09-18",
      checkOut: "2026-09-23",
      guests: 4,
      preservedQuery: "utm_source=instagram",
      returnTo: "/havens/blue-haven?checkIn=2026-09-18&checkOut=2026-09-23&guests=4#reserve",
    })

    const parsed = new URL(href, "https://enchantedhavens.com")
    expect(parsed.pathname).toBe("/contact")
    expect(Object.fromEntries(parsed.searchParams)).toMatchObject({
      property: "blue-haven",
      variant: "blue-haven",
      checkIn: "2026-09-18",
      checkOut: "2026-09-23",
      guests: "4",
      utm_source: "instagram",
      returnTo: "/havens/blue-haven?checkIn=2026-09-18&checkOut=2026-09-23&guests=4#reserve",
    })
  })

  it("updates the return link when the guest changes or clears a stay", () => {
    const input = {property: "blue-haven", returnTo: "/havens/blue-haven?checkIn=2027-04-15&checkOut=2027-04-19&guests=2&utm_source=planner#reserve"}
    const updated = new URL(buildInquiryHref({...input, checkIn: "2027-05-10", checkOut: "2027-05-14", guests: 4}), "https://enchantedhavens.com")
    expect(updated.searchParams.get("returnTo")).toBe("/havens/blue-haven?checkIn=2027-05-10&checkOut=2027-05-14&guests=4&utm_source=planner#reserve")
    const cleared = new URL(buildInquiryHref({...input, guests: 3}), "https://enchantedhavens.com")
    expect(cleared.searchParams.get("returnTo")).toBe("/havens/blue-haven?guests=3&utm_source=planner#reserve")
  })

  it("accepts only local Haven return paths", () => {
    expect(safeContactReturnPath("/havens/blue-haven?guests=2#reserve", "/havens")).toBe("/havens/blue-haven?guests=2#reserve")
    expect(safeContactReturnPath("https://example.com/steal", "/havens")).toBe("/havens")
    expect(safeContactReturnPath("//example.com/steal", "/havens")).toBe("/havens")
    expect(safeContactReturnPath("/contact", "/havens")).toBe("/havens")
  })
})
