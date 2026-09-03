import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { hashAdminToken, normalizeAdminEmail } from "@/lib/admin-auth-utils"

describe("admin authentication utilities", () => {
  it("normalizes emails before authorization lookups", () => {
    expect(normalizeAdminEmail("  Yunhang.Chen@GMAIL.com ")).toBe("yunhang.chen@gmail.com")
  })

  it("stores deterministic token hashes instead of raw access tokens", () => {
    const hash = hashAdminToken("one-time-link")
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).toBe(hashAdminToken("one-time-link"))
    expect(hash).not.toContain("one-time-link")
  })

  it("does not consume emailed links during automated GET checks", () => {
    const confirmationPage = readFileSync("app/admin/auth/verify/page.tsx", "utf8")
    const completionRoute = readFileSync("app/admin/auth/verify/complete/route.ts", "utf8")

    expect(confirmationPage).not.toContain("consumeAdminAccessToken")
    expect(completionRoute).toContain("export async function POST")
    expect(completionRoute).toContain("consumeAdminAccessToken")
  })

  it("completes sign-in with a guarded client request and explicit navigation", () => {
    const confirmation = readFileSync("components/admin/admin-access-confirmation.tsx", "utf8")
    const completionRoute = readFileSync("app/admin/auth/verify/complete/route.ts", "utf8")

    expect(confirmation).toContain("submitting.current")
    expect(confirmation).toContain('credentials: "same-origin"')
    expect(confirmation).toContain("window.location.replace")
    expect(completionRoute).toContain("response.cookies.set")
  })

  it("treats repeat confirmation as successful when the browser already has a session", () => {
    const completionRoute = readFileSync("app/admin/auth/verify/complete/route.ts", "utf8")
    const adminAuth = readFileSync("lib/admin-auth.ts", "utf8")

    expect(completionRoute).toContain("if (await getCurrentAdminUser()) return successResponse(request)")
    expect(adminAuth).toContain('? "used"')
    expect(adminAuth).toContain('? "expired"')
  })
})
