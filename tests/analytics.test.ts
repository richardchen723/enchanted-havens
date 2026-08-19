import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("analytics integrations", () => {
  it("loads Microsoft Clarity site-wide from the configured project", () => {
    const layout = readFileSync("app/layout.tsx", "utf8")
    const clarity = readFileSync("components/microsoft-clarity.tsx", "utf8")

    expect(layout).toContain("NEXT_PUBLIC_CLARITY_PROJECT_ID")
    expect(layout).toContain(".trim()")
    expect(layout).toContain("<MicrosoftClarity")
    expect(layout).toContain('allowedHosts={["enchantedhavens.com", "www.enchantedhavens.com"]}')
    expect(clarity).toContain("https://www.clarity.ms/tag/")
    expect(clarity).toContain('strategy="afterInteractive"')
    expect(clarity).toContain("window.location.hostname.toLowerCase()")
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
