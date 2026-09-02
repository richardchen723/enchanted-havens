import { describe, expect, it } from "vitest"
import { appendQuery, buildStayQuery, parseStaySelection } from "@/lib/stay-search"

describe("stay search continuity", () => {
  it("keeps valid dates, guests, and attribution parameters", () => {
    const params = {
      checkIn: "2027-04-15",
      checkOut: "2027-04-19",
      guests: "5",
      utm_source: "instagram",
      utm_campaign: "spring",
      coupon: "RETURN15",
      unrelated: "discarded",
    }
    const selection = parseStaySelection(params)

    expect(selection).toEqual({ checkIn: "2027-04-15", checkOut: "2027-04-19", guests: 5 })
    expect(buildStayQuery(params, selection)).toBe("checkIn=2027-04-15&checkOut=2027-04-19&guests=5&utm_source=instagram&utm_campaign=spring&coupon=RETURN15")
  })

  it("rejects invalid date ranges and avoids query noise for casual browsing", () => {
    const selection = parseStaySelection({ checkIn: "2027-04-19", checkOut: "2027-04-15" })

    expect(selection).toEqual({ checkIn: "", checkOut: "", guests: 1 })
    expect(buildStayQuery({}, selection)).toBe("")
    expect(appendQuery("/havens/blue-haven", "")).toBe("/havens/blue-haven")
  })
})
