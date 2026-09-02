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
})
