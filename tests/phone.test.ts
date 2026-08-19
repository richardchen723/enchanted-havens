import { describe, expect, it } from "vitest"
import { formatUsPhoneInput, isValidUsPhone, toE164UsPhone } from "@/lib/phone"

describe("US phone numbers", () => {
  it("formats checkout input without changing its digits", () => {
    expect(formatUsPhoneInput("7701231234")).toBe("(770)123-1234")
    expect(formatUsPhoneInput("(770) 123-1234")).toBe("(770)123-1234")
    expect(formatUsPhoneInput("+1 770 123 1234")).toBe("(770)123-1234")
  })

  it("normalizes valid values for Stripe and Hostaway", () => {
    expect(isValidUsPhone("(770)123-1234")).toBe(true)
    expect(toE164UsPhone("(770)123-1234")).toBe("+17701231234")
    expect(toE164UsPhone("+1 (770) 123-1234")).toBe("+17701231234")
  })

  it("rejects incomplete numbers", () => {
    expect(isValidUsPhone("(770)123-12")).toBe(false)
    expect(() => toE164UsPhone("(770)123-12")).toThrow("valid 10-digit")
  })
})
