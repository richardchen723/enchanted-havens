import { BRAND_BOOKING_ENGINE_URL, BRAND_CONTACT_EMAIL, BRAND_CONTACT_PHONE, BRAND_INSTAGRAM_URL, BRAND_LOGO_PATH, BRAND_NAME, BRAND_SAME_AS } from "@/lib/brand"
import { absoluteUrl } from "@/lib/utils"

export const BRAND_AREA_SERVED = ["Lake Sutherland", "Olympic Peninsula", "Hood Canal", "Whidbey Island", "Puget Sound", "Washington Coast"]

type BrandEntityInput = {
  areaServed?: string[]
  description?: string
  knowsAbout?: string[]
}

export function brandContactPoint() {
  return [
    {
      "@type": "ContactPoint",
      contactType: "reservations and guest support",
      email: BRAND_CONTACT_EMAIL,
      telephone: BRAND_CONTACT_PHONE,
      url: absoluteUrl("/contact"),
      areaServed: "US",
      availableLanguage: ["en-US", "en"],
    },
  ]
}

export function brandEntityFields(input: BrandEntityInput = {}) {
  return {
    name: BRAND_NAME,
    url: absoluteUrl(),
    logo: absoluteUrl(BRAND_LOGO_PATH),
    description: input.description || "A curated direct-book collection of rare Pacific Northwest waterfront, lakefront, forest, and private-estate vacation rentals.",
    email: BRAND_CONTACT_EMAIL,
    telephone: BRAND_CONTACT_PHONE,
    contactPoint: brandContactPoint(),
    sameAs: BRAND_SAME_AS,
    areaServed: input.areaServed || BRAND_AREA_SERVED,
    subjectOf: [
      { "@type": "WebSite", name: "Direct booking portal", url: BRAND_BOOKING_ENGINE_URL },
      { "@type": "WebSite", name: "Instagram", url: BRAND_INSTAGRAM_URL },
    ],
    ...(input.knowsAbout ? { knowsAbout: input.knowsAbout } : {}),
  }
}
