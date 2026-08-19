import { describe, expect, it } from "vitest"
import { contactSchema } from "@/lib/schemas"

const requiredContactDetails = {
  name: "Avery Stone",
  email: "avery@example.com",
}

describe("contact inquiry validation", () => {
  it("accepts an empty or omitted stay-details message", () => {
    expect(contactSchema.parse({ ...requiredContactDetails, message: "" }).message).toBe("")
    expect(contactSchema.parse(requiredContactDetails).message).toBe("")
    expect(contactSchema.parse({ ...requiredContactDetails, message: "Hi" }).message).toBe("Hi")
  })

  it("accepts an omitted phone number", () => {
    expect(contactSchema.parse(requiredContactDetails).phone).toBeUndefined()
  })

  it("still requires a valid email address", () => {
    expect(contactSchema.safeParse({ name: "Avery Stone" }).success).toBe(false)
    expect(contactSchema.safeParse({ ...requiredContactDetails, email: "not-an-email" }).success).toBe(false)
  })
})
