import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ownerInquirySchema } from "@/lib/owner-inquiry-schema"

const mocks = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn(() => ({ sendMail: mocks.send })) } }))
import { sendOwnerInquiryNotification } from "@/lib/email"

const originalEnv = { ...process.env }
const input = { ...ownerInquirySchema.parse({ name: "Avery Stone", email: "avery@example.com", propertyAddress: "123 Example Lane, Belfair, WA 98528", bedrooms: 3, bathrooms: 2.5, features: ["Oceanfront", "Hot tub"] }), reference: "EH-OWNER-12345678" }
beforeEach(() => { process.env = { ...originalEnv, GMAIL_USER: "test@example.com", GMAIL_APP_PASSWORD: "test-only", GMAIL_SMTP_HOST: "127.0.0.1" }; delete process.env.OWNER_INQUIRY_TO_EMAIL; delete process.env.CONTACT_TO_EMAIL; mocks.send.mockReset(); mocks.send.mockResolvedValue({ accepted: ["stays@enchantedhavens.com"] }) })
afterEach(() => { process.env = { ...originalEnv } })

describe("owner email routing", () => {
  it("labels owner inquiries separately and uses the shared business inbox by default", async () => {
    expect(await sendOwnerInquiryNotification(input)).toBe(true)
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "stays@enchantedhavens.com", replyTo: "avery@example.com", subject: expect.stringContaining("Owner management inquiry"), text: expect.stringContaining("Property address: 123 Example Lane, Belfair, WA 98528\nBedrooms: 3\nBathrooms: 2.5\nProperty features: Oceanfront, Hot tub") }))
  })
  it("labels studios and an unanswered feature checklist clearly", async () => {
    await sendOwnerInquiryNotification({ ...input, bedrooms: 0, features: [] })
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining("Bedrooms: 0 (studio)\nBathrooms: 2.5\nProperty features: Not provided") }))
  })
  it("supports a dedicated owner recipient without changing guest email routing", async () => {
    process.env.OWNER_INQUIRY_TO_EMAIL = "owners@example.com"
    await sendOwnerInquiryNotification(input)
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "owners@example.com" }))
  })
  it("does not claim delivery when SMTP accepts no recipients or is unconfigured", async () => {
    mocks.send.mockResolvedValue({ accepted: [] })
    expect(await sendOwnerInquiryNotification(input)).toBe(false)
    delete process.env.GMAIL_APP_PASSWORD
    expect(await sendOwnerInquiryNotification(input)).toBe(false)
  })
})
