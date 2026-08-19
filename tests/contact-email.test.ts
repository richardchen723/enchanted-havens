import { readFileSync } from "node:fs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}))

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mocks.send })),
  },
}))

import { DEFAULT_CONTACT_TO_EMAIL, sendContactAcknowledgement, sendContactNotification } from "@/lib/email"

const originalEnv = { ...process.env }
const inquiry = {
  reference: "EH-7C9A12F4",
  name: "Avery Stone",
  email: "avery@example.com",
  phone: "2065550119",
  tripType: "Family gathering",
  message: "We are planning a family stay for eight guests in September.",
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env = {
    ...originalEnv,
    GMAIL_USER: "yunhang.chen@gmail.com",
    GMAIL_APP_PASSWORD: "test-app-password",
    GMAIL_SMTP_HOST: "127.0.0.1",
  }
  delete process.env.CONTACT_TO_EMAIL
  delete process.env.BOOKING_FROM_EMAIL
  mocks.send.mockResolvedValue({ messageId: "email_123" })
})

afterEach(() => {
  process.env = { ...originalEnv }
})

describe("contact inquiry delivery", () => {
  it("sends new inquiries to the shared stay-team alias by default", async () => {
    await expect(sendContactNotification(inquiry)).resolves.toBe(true)
    expect(DEFAULT_CONTACT_TO_EMAIL).toBe("stays@enchantedhavens.com")
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      from: "Enchanted Havens <yunhang.chen@gmail.com>",
      to: "stays@enchantedhavens.com",
      replyTo: inquiry.email,
      subject: "New stay inquiry EH-7C9A12F4 from Avery Stone",
    }))
  })

  it("emails a reassuring acknowledgement and reference to the guest", async () => {
    await expect(sendContactAcknowledgement(inquiry)).resolves.toBe(true)
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({
      from: "Enchanted Havens <yunhang.chen@gmail.com>",
      to: inquiry.email,
      replyTo: "stays@enchantedhavens.com",
      subject: "We received your Enchanted Havens inquiry · EH-7C9A12F4",
    }))
  })

  it("does not report success when Gmail rejects delivery", async () => {
    mocks.send.mockRejectedValue(new Error("Invalid login"))
    await expect(sendContactNotification(inquiry)).rejects.toThrow("could not be delivered")
  })

  it("reports that delivery is unavailable when Gmail is not configured", async () => {
    delete process.env.GMAIL_APP_PASSWORD
    await expect(sendContactNotification(inquiry)).resolves.toBe(false)
    expect(mocks.send).not.toHaveBeenCalled()
  })

  it("keeps the trip-type select visually aligned with the other fields", () => {
    const source = readFileSync("components/contact-form.tsx", "utf8")
    expect(source).toContain("h-[3.6rem]")
    expect(source).toContain("appearance-none")
    expect(source).toContain("ChevronDown")
  })

  it("requires email while leaving phone and stay details optional", () => {
    const source = readFileSync("components/contact-form.tsx", "utf8")
    const email = source.match(/<input[^>]*name="email"[^>]*\/>/)?.[0]
    const phone = source.match(/<input[^>]*name="phone"[^>]*\/>/)?.[0]
    const message = source.match(/<textarea[^>]*name="message"[^>]*\/>/)?.[0]

    expect(email).toContain("required")
    expect(phone).not.toContain("required")
    expect(message).not.toContain("required")
  })
})
