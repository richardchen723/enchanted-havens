import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("analytics integrations", () => {
  it("loads Microsoft Clarity on the public site but not the private admin surface", () => {
    const layout = readFileSync("app/layout.tsx", "utf8")
    const siteFrame = readFileSync("components/site-frame.tsx", "utf8")
    const clarity = readFileSync("components/microsoft-clarity.tsx", "utf8")

    expect(layout).toContain("NEXT_PUBLIC_CLARITY_PROJECT_ID")
    expect(layout).toContain(".trim()")
    expect(siteFrame).toContain('pathname?.startsWith("/admin")')
    expect(siteFrame.indexOf("if (isAdmin)")).toBeLessThan(siteFrame.indexOf("<MicrosoftClarity"))
    expect(siteFrame).toContain('allowedHosts={["enchantedhavens.com", "www.enchantedhavens.com"]}')
    expect(siteFrame).toContain('siteLabel="enchanted_havens"')
    expect(clarity).toContain("https://www.clarity.ms/tag/")
    expect(clarity).toContain('strategy="afterInteractive"')
    expect(clarity).toContain("window.location.hostname.toLowerCase()")
    expect(clarity).toContain('window.clarity("set","eh_hostname"')
    expect(clarity).toContain('window.clarity("set","eh_site"')
  })

  it("allows Clarity collection endpoints through the content security policy", () => {
    const config = readFileSync("next.config.ts", "utf8")

    expect(config).toContain("https://*.clarity.ms")
    expect(config).toContain("https://c.bing.com")
  })

  it("discloses behavior analytics in the privacy policy", () => {
    const privacy = readFileSync("app/privacy/page.tsx", "utf8")

    expect(privacy).toContain("Microsoft Clarity")
    expect(privacy).toContain("session recordings")
  })
})
