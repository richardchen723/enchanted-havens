import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { BRAND_CONTACT_EMAIL, BRAND_CONTACT_PHONE, BRAND_CONTACT_PHONE_DISPLAY, BRAND_INSTAGRAM_URL } from "@/lib/brand"
import { brandContactPoint, brandEntityFields } from "@/lib/brand-schema"

describe("site contact details", () => {
  it("keeps the reservations phone available in the desktop and mobile header", () => {
    const source = readFileSync("components/site-header.tsx", "utf8")

    expect(source).toContain("BRAND_CONTACT_PHONE_DISPLAY")
    expect(source.match(/tel:\$\{BRAND_CONTACT_PHONE\}/g)).toHaveLength(3)
    expect(BRAND_CONTACT_PHONE_DISPLAY).toBe("(360) 230-8143")
    expect(BRAND_CONTACT_PHONE).toBe("+13602308143")
  })

  it("includes tappable phone and email links in the footer", () => {
    const source = readFileSync("components/site-footer.tsx", "utf8")

    expect(source).toContain("tel:${BRAND_CONTACT_PHONE}")
    expect(source).toContain("mailto:${BRAND_CONTACT_EMAIL}")
    expect(BRAND_CONTACT_EMAIL).toBe("stays@enchantedhavens.com")
  })

  it("adds the same phone number to the organization contact schema", () => {
    expect(brandEntityFields().telephone).toBe(BRAND_CONTACT_PHONE)
    expect(brandContactPoint()).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: BRAND_CONTACT_EMAIL, telephone: BRAND_CONTACT_PHONE }),
    ]))
  })

  it("uses the Instagram brand glyph and links the verified profile from the header and footer", () => {
    const iconSource = readFileSync("components/instagram-brand-icon.tsx", "utf8")
    const headerSource = readFileSync("components/site-header.tsx", "utf8")
    const footerSource = readFileSync("components/site-footer.tsx", "utf8")

    expect(BRAND_INSTAGRAM_URL).toBe("https://www.instagram.com/enchanted.havens/")
    expect(iconSource).toContain("InstagramBrandIcon")
    expect(iconSource).toContain("M7.0301.084")
    expect(headerSource).toContain("BRAND_INSTAGRAM_URL")
    expect(headerSource).toContain("InstagramBrandIcon")
    expect(headerSource).toContain("place-items-center transition-opacity hover:opacity-55")
    expect(headerSource).not.toContain('place-items-center border transition hover:-translate-y-0.5')
    expect(footerSource).toContain("BRAND_INSTAGRAM_URL")
    expect(footerSource).toContain("InstagramBrandIcon")
    expect(footerSource).not.toContain("border border-white/22")
    expect(footerSource).not.toContain("<Camera")
  })
})
