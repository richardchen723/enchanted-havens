import { afterEach, expect, it, vi } from "vitest"
import { GET } from "@/app/all-listings/route"
import { buildSitemap } from "@/app/sitemap"
import { fallbackProperties } from "@/lib/editorial"
import { propertyGalleryCaption, propertyGalleryImageAlt } from "@/lib/property-image-seo"
import captions from "@/lib/gallery-photo-captions.json"
import { metadata as privacy } from "@/app/privacy/page"
import { metadata as terms } from "@/app/terms/page"
import { metadata as ownerPolicy } from "@/app/owner-policy/page"

afterEach(() => vi.useRealTimers())

it("permanently redirects collection links with normalized booking context", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-27T12:00:00Z"))
  const response = GET(new Request("https://www.enchantedhavens.com/all-listings?arrival=2027-04-15&departure=2027-04-19&adults=6&utm_source=chatgpt&unknown=x"))
  expect(response.status).toBe(308)
  expect(response.headers.get("location")).toBe("https://www.enchantedhavens.com/havens?checkIn=2027-04-15&checkOut=2027-04-19&guests=6&utm_source=chatgpt")
})

it("keeps sitemap modification dates stable across builds and omits unknown dates", () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-27T12:00:00Z"))
  const before = buildSitemap(fallbackProperties)
  vi.setSystemTime(new Date("2027-01-01T12:00:00Z"))
  expect(buildSitemap(fallbackProperties)).toEqual(before)
  expect(before.every(item => typeof item.lastModified === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.lastModified))).toBe(true)
  const changed = [{ ...fallbackProperties[0], slug: "future-unreviewed-home" }]
  expect(buildSitemap(changed).find(item => item.url.endsWith("/havens/future-unreviewed-home"))?.lastModified).toBeUndefined()
})

it("matches captions to actual images across resizing and ordering, with neutral unknowns", () => {
  const [path, caption] = Object.entries(captions).find(([, text]) => text.includes("Food arranged"))!
  expect(propertyGalleryCaption(`https://bookingimages.hostaway.com${path}?width=1200`)).toBe(caption)
  expect(propertyGalleryImageAlt({ name: "Blue Haven", location: "Lake Sutherland", index: 30, src: `https://bookingimages.hostaway.com${path}` })).toContain(caption.toLowerCase())
  expect(propertyGalleryCaption("https://example.com/future-photo.jpg")).toBeUndefined()
  expect(propertyGalleryImageAlt({ name: "Blue Haven", location: "Lake Sutherland", index: 1, tags: ["Hot tub"], src: "https://example.com/future.jpg" })).not.toContain("Hot tub")
})

it("gives legal pages canonical URLs while retaining owner-policy privacy", () => {
  expect(privacy.alternates).toMatchObject({ canonical: "/privacy" })
  expect(terms.alternates).toMatchObject({ canonical: "/terms" })
  expect(ownerPolicy.alternates).toMatchObject({ canonical: "/owner-policy" })
  expect(ownerPolicy.robots).toMatchObject({ index: false, follow: false })
})
