import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ requireAdminUser: vi.fn(), saveAffiliate: vi.fn(), updateCommission: vi.fn(), listAffiliateCommissions: vi.fn() }))
vi.mock("@/lib/admin-auth", () => ({ requireAdminUser: mocks.requireAdminUser }))
vi.mock("@/lib/affiliates", () => ({ saveAffiliate: mocks.saveAffiliate, updateCommission: mocks.updateCommission, listAffiliateCommissions: mocks.listAffiliateCommissions }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`) } }))
import { saveAffiliateAction, updateCommissionAction } from "@/app/admin/affiliates/actions"
import { GET } from "@/app/admin/affiliates/export/route"

describe("affiliate administration", () => {
  beforeEach(() => vi.clearAllMocks())
  it("requires authentication before any admin write or report export", async () => {
    mocks.requireAdminUser.mockRejectedValue(new Error("sign-in-required"))
    await expect(saveAffiliateAction(new FormData())).rejects.toThrow("sign-in-required")
    await expect(updateCommissionAction(new FormData())).rejects.toThrow("sign-in-required")
    await expect(GET()).rejects.toThrow("sign-in-required")
    expect(mocks.saveAffiliate).not.toHaveBeenCalled()
    expect(mocks.updateCommission).not.toHaveBeenCalled()
    expect(mocks.listAffiliateCommissions).not.toHaveBeenCalled()
  })
  it("rejects invalid commission amounts and missing notes", async () => {
    mocks.requireAdminUser.mockResolvedValue({ id: "admin" })
    const form = new FormData()
    form.set("id", "0d60019d-1d4f-4e81-b572-a51cd2f9b8bb")
    form.set("status", "paid")
    form.set("amount", "-1")
    form.set("notes", "")
    await expect(updateCommissionAction(form)).rejects.toThrow("invalid-commission")
    expect(mocks.updateCommission).not.toHaveBeenCalled()
  })
  it("exports USD amounts with formula injection protection and no guest contact fields", async () => {
    mocks.requireAdminUser.mockResolvedValue({ id: "admin" })
    mocks.listAffiliateCommissions.mockResolvedValue([{
      affiliate_name: '=HYPERLINK("bad")', snapshot: { code: "partner", revenueBasis: 1000, discountAmount: 100, commissionAmount: 150 },
      booking_session_id: "booking", hostaway_reservation_id: 716, property_slug: "emerald-haven",
      check_in: "2027-01-10", check_out: "2027-01-13", amount: 150, status: "owed", payout_notes: "",
      guest_email: "private@example.com",
    }])
    const response = await GET()
    const csv = await response.text()
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(csv).toContain('"USD"')
    expect(csv).toContain("'=HYPERLINK")
    expect(csv).not.toContain("private@example.com")
  })
})
