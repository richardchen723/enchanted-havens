import { expect, test } from "@playwright/test"

const retiredIds = [558675, 558676, 558677, 558678, 571917]
const retiredCopy = /cove[ -]club|whidbey-estate|Freeland|57690-(?:55867[5-8]|571917)-/i

test("retired property and guide URLs are unavailable", async ({ request }) => {
  const paths = [
    "/havens/whidbey-estate",
    ...["lighthouse", "lodge", "full-estate", "main-house", "guest-house"].map((slug) => `/havens/whidbey-estate/${slug}`),
    "/booking/whidbey-estate",
    "/destinations/whidbey-island-private-estate-rentals",
    "/groups/private-estate-rental-washington",
    "/experiences/private-estate-gatherings",
    "/images/cove-club/cove-club-exterior-15.png",
  ]
  for (const path of paths) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(404)
  }
})

test("retired listing APIs and redirects reject stale links", async ({ request }) => {
  for (const id of retiredIds) {
    for (const path of [`/listings/${id}`, `/api/gallery/${id}`, `/api/calendar/${id}`]) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(response.status(), path).toBe(404)
    }
    const quote = await request.post("/api/quotes", {
      data: { listingId: id, checkIn: "2027-04-15", checkOut: "2027-04-19", guests: 2 },
    })
    expect(quote.status(), `quote ${id}`).toBe(404)
  }
})

test("published sitemap and pages contain no retired content", async ({ request }) => {
  test.setTimeout(180_000)
  const response = await request.get("/sitemap.xml")
  const sitemap = await response.text()
  expect(sitemap).not.toMatch(retiredCopy)
  const paths = [...new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname))]
  expect(paths).toContain("/havens/reflection-point")
  for (const path of paths) {
    const page = await request.get(path)
    expect(page.status(), path).toBe(200)
    expect(await page.text(), path).not.toMatch(retiredCopy)
  }
})

test("collection and inquiry show only the seven active homes", async ({ page }) => {
  await page.goto("/havens")
  await expect(page.locator("#collection article")).toHaveCount(7)
  await expect(page.locator("body")).not.toContainText(/Cove Club|Private estate/i)
  await page.goto("/contact?tripType=The+Cove+Club")
  await expect(page.locator('select[name="tripType"]')).toHaveValue("")
  await expect(page.locator('select[name="tripType"]')).not.toContainText("Cove Club")
})
