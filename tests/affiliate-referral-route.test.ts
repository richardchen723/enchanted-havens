import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ getActiveAffiliate: vi.fn(), recordReferralVisit: vi.fn() }))
vi.mock("@/lib/affiliates", () => mocks)
import { GET } from "@/app/r/[code]/route"

describe("referral links", () => {
  beforeEach(() => vi.clearAllMocks())
  it("sets a private 30-day last-referral cookie and redirects to the haven", async () => {
    mocks.getActiveAffiliate.mockResolvedValue({ id: "partner-id", code: "partner-one" })
    const response = await GET(new Request("https://enchantedhavens.com/r/partner-one?haven=emerald-haven", { headers: { Cookie: "enchanted_referral=older-partner" } }), { params: Promise.resolve({ code: "partner-one" }) })
    expect(response.status).toBe(307)
    expect(response.headers.get("Location")).toBe("https://enchantedhavens.com/havens/emerald-haven")
    expect(response.headers.get("Set-Cookie")).toContain("enchanted_referral=partner-one")
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=2592000")
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly")
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(mocks.recordReferralVisit).toHaveBeenCalledWith("partner-id")
  })
  it("does not set a cookie or count a visit for invalid/inactive offers", async () => {
    mocks.getActiveAffiliate.mockResolvedValue(null)
    const response = await GET(new Request("https://enchantedhavens.com/r/missing"), { params: Promise.resolve({ code: "missing" }) })
    expect(response.headers.get("Set-Cookie")).toBeNull()
    expect(mocks.recordReferralVisit).not.toHaveBeenCalled()
  })
})
