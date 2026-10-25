import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ownerInquirySchema } from "@/lib/owner-inquiry-schema"

const mocks = vi.hoisted(() => ({ deliver: vi.fn() }))
vi.mock("@/lib/owner-inquiries", async (importOriginal) => ({ ...await importOriginal<typeof import("@/lib/owner-inquiries")>(), deliverOwnerInquiry: mocks.deliver }))
import { POST } from "@/app/api/owner-inquiries/route"
import { OwnerInquiryError } from "@/lib/owner-inquiries"

const details = { name: "Avery Stone", email: "avery@example.com", propertyLocation: "Port Angeles" }
function jsonRequest(body: unknown, ip = randomUUID()) {
  return new Request("https://enchantedhavens.com/api/owner-inquiries", { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": ip }, body: JSON.stringify(body) })
}

beforeEach(() => { mocks.deliver.mockReset(); mocks.deliver.mockResolvedValue({ ok: true, reference: "EH-OWNER-12345678", duplicate: false }) })
afterEach(() => { vi.restoreAllMocks() })

describe("owner inquiry validation and delivery", () => {
  it("requires only name, email and location, and normalizes whitespace", () => {
    expect(ownerInquirySchema.parse({ ...details, name: "  Avery Stone  " })).toMatchObject({ ...details, phone: "", message: "" })
    for (const propertyLocation of ["", "  "]) expect(ownerInquirySchema.safeParse({ ...details, propertyLocation }).success).toBe(false)
    expect(ownerInquirySchema.safeParse({ ...details, email: "incorrect" }).success).toBe(false)
  })
  it("rejects bot fields and header injection without sending", async () => {
    for (const invalid of [{ website: "spam" }, { name: "Avery\r\nBcc: other@example.com" }, { message: "x".repeat(4001) }]) {
      expect((await POST(jsonRequest({ ...details, ...invalid }))).status).toBe(400)
    }
    expect(mocks.deliver).not.toHaveBeenCalled()
  })
  it("only confirms success after delivery and passes the retry key through", async () => {
    const submissionKey = randomUUID()
    const response = await POST(jsonRequest({ ...details, submissionKey }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true, reference: "EH-OWNER-12345678" })
    expect(mocks.deliver).toHaveBeenCalledWith(expect.objectContaining({ ...details, submissionKey }))
    expect(response.headers.get("cache-control")).toBe("no-store")
  })
  it("returns a retryable error when delivery is unavailable, without a success receipt", async () => {
    mocks.deliver.mockRejectedValue(new OwnerInquiryError("Please call our team.", 503))
    const response = await POST(jsonRequest(details))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: "Please call our team." })
  })
  it("accepts native browser form posts without JavaScript and redirects after success", async () => {
    const response = await POST(new Request("https://enchantedhavens.com/api/owner-inquiries", { method: "POST", body: new URLSearchParams(details), headers: { "X-Forwarded-For": randomUUID() } }))
    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe("/vacation-rental-management/thank-you")
  })
  it("preserves and escapes entered details on native form failure", async () => {
    mocks.deliver.mockRejectedValue(new OwnerInquiryError("Temporarily unavailable.", 503))
    const response = await POST(new Request("https://enchantedhavens.com/api/owner-inquiries", { method: "POST", body: new URLSearchParams({ ...details, message: '</textarea><script>alert("test")</script>' }), headers: { "X-Forwarded-For": randomUUID() } }))
    const html = await response.text()
    expect(response.status).toBe(503)
    expect(html).toContain('value="Port Angeles"')
    expect(html).toContain("&lt;/textarea&gt;&lt;script&gt;")
    expect(html).not.toContain("<script>")
    expect(html).toMatch(/name="submissionKey" value="[\da-f-]{36}"/)
  })
  it("rejects cross-origin submissions and excessive attempts", async () => {
    const request = jsonRequest(details)
    request.headers.set("Origin", "https://other.example")
    expect((await POST(request)).status).toBe(403)
    request.headers.set("Origin", "null")
    expect((await POST(request)).status).toBe(403)
    const ip = randomUUID()
    for (let n = 0; n < 5; n++) expect((await POST(jsonRequest(details, ip))).status).toBe(200)
    expect((await POST(jsonRequest(details, ip))).status).toBe(429)
  })
})
