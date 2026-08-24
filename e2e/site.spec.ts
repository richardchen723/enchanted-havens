import { expect, test, type Page } from "@playwright/test"

async function mockQuote(page: Page, { total, nights, checkIn, checkOut, guests }: { total: number; nights: number; checkIn: string; checkOut: string; guests: number }) {
  await page.route("**/api/quotes", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        source: "hostaway",
        quote: {
          listingId: 178403,
          checkIn,
          checkOut,
          guests,
          nights,
          total,
          currency: "USD",
          available: true,
          components: [
            { type: "accommodation", name: "baseRate", title: "Base rate", value: total - 200, total: total - 200, isIncludedInTotalPrice: 1 },
            { type: "fee", name: "cleaningFee", title: "Cleaning fee", value: 200, total: 200, isIncludedInTotalPrice: 1 },
          ],
        },
      }),
    })
  })
}

test("homepage presents the brand and collection", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /The Pacific Northwest/i })).toBeVisible()
  await expect(page.getByRole("link", { name: "Explore the Collection" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Aurora Haven" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Reflection Haven" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "The Cove Club" })).toBeVisible()
  await expect(page.locator("article").filter({ hasText: "Aurora Haven" }).getByText("Olympic Peninsula")).toBeVisible()
  await expect(page.locator("article").filter({ hasText: "Aurora Haven" }).getByText("Port Angeles, Washington")).toBeVisible()
  const coveClubCard = page.locator("article").filter({ hasText: "The Cove Club" })
  await expect(coveClubCard.getByText("Freeland")).toBeVisible()
  await expect(coveClubCard.getByText("Up to 42 guests")).toBeVisible()
  await expect(coveClubCard.getByText("19 bedrooms")).toBeVisible()
  await expect(coveClubCard.getByText("19 baths")).toBeVisible()
  await expect(
    page.getByRole("heading", { name: /Twenty-three acres\. One private world\./i }),
  ).toBeVisible()
})

test("contact form requires email but permits empty phone and stay details", async ({ page }) => {
  let submitted: Record<string, string> | undefined
  await page.route("**/api/contact", async (route) => {
    submitted = route.request().postDataJSON()
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) })
  })
  await page.goto("/contact")

  await expect(page.getByLabel("Email")).toHaveAttribute("required", "")
  await expect(page.getByLabel("Phone")).not.toHaveAttribute("required", "")
  await expect(page.getByLabel("Tell us about the stay")).not.toHaveAttribute("required", "")

  await page.getByLabel("Name").fill("Avery Stone")
  await page.getByLabel("Email").fill("avery@example.com")
  await page.getByRole("button", { name: "Send Inquiry" }).click()

  await expect(page.getByRole("heading", { name: "Your note is with us." })).toBeVisible()
  expect(submitted).toMatchObject({
    email: "avery@example.com",
    phone: "",
    message: "",
  })
})

test("contact form immediately confirms that an inquiry is being sent", async ({ page }) => {
  let releaseResponse = () => {}
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })
  await page.route("**/api/contact", async (route) => {
    await responseGate
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) })
  })
  await page.goto("/contact")

  await page.getByLabel("Name").fill("Avery Stone")
  await page.getByLabel("Email").fill("avery@example.com")
  await page.getByRole("button", { name: "Send Inquiry" }).click()

  await expect(page.getByRole("button", { name: "Sending Inquiry" })).toBeDisabled()
  await expect(page.getByRole("status")).toHaveText("Sending securely—please keep this page open.")

  releaseResponse()
  await expect(page.getByRole("heading", { name: "Your note is with us." })).toBeVisible()
})

test("homepage hero has no horizontal separator rules", async ({ page }) => {
  await page.goto("/")

  const separators = await page.evaluate(() => {
    const header = document.querySelector("header")
    const supportingContent = document.querySelector(".hero-reveal-delay")
    if (!header || !supportingContent) return null
    return {
      headerBorderWidth: getComputedStyle(header).borderBottomWidth,
      contentBorderWidth: getComputedStyle(supportingContent).borderTopWidth,
    }
  })

  expect(separators).not.toBeNull()
  expect(separators!.headerBorderWidth).toBe("0px")
  expect(separators!.contentBorderWidth).toBe("0px")
})

test("homepage availability search stays clear of the hero content", async ({ page }, testInfo) => {
  await page.goto("/")

  const heroContent = page.locator(".hero-reveal-delay")
  const search = page.locator("#availability")
  const collectionHeading = page.getByRole("heading", { name: "Not more places. The right ones." })
  await expect(heroContent).toBeVisible()
  await expect(search).toBeVisible()
  await expect(collectionHeading).toBeVisible()

  const [heroBox, searchBox, collectionBox] = await Promise.all([
    heroContent.boundingBox(),
    search.boundingBox(),
    collectionHeading.boundingBox(),
  ])

  expect(heroBox).not.toBeNull()
  expect(searchBox).not.toBeNull()
  expect(collectionBox).not.toBeNull()
  expect(searchBox!.y - (heroBox!.y + heroBox!.height)).toBeGreaterThanOrEqual(24)
  expect(collectionBox!.y - (searchBox!.y + searchBox!.height)).toBeGreaterThanOrEqual(testInfo.project.name === "mobile" ? 48 : 64)
})

test("homepage guest control matches the stay date control", async ({ page }) => {
  await page.goto("/")

  const [datesBox, guestsBox] = await Promise.all([
    page.locator('#availability [data-availability-source] > div').boundingBox(),
    page.getByRole("group", { name: "Search guests" }).boundingBox(),
  ])

  expect(datesBox).not.toBeNull()
  expect(guestsBox).not.toBeNull()
  expect(Math.abs(datesBox!.height - guestsBox!.height)).toBeLessThanOrEqual(1)
  await expect(page.getByRole("group", { name: "Search guests" })).toContainText("Guests")
})

test("Havens collection proof points open measurable discovery journeys", async ({ page }) => {
  await page.goto("/havens")

  const journeys = [
    { name: /7 havens.*Explore/i, href: "#collection" },
    { name: /4 settings.*Explore/i, href: "/destinations" },
    { name: /Up to 12 guests.*Explore/i, href: "/havens?guests=12#collection" },
    { name: /6 waterfront havens.*Explore/i, href: "/havens?experience=waterfront#collection" },
  ]

  for (const journey of journeys) {
    const link = page.getByRole("link", { name: journey.name })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", journey.href)
    await expect(link.getByText("Explore", { exact: true })).toBeVisible()
  }

  await page.getByRole("link", { name: journeys[3].name }).click()
  await expect(page).toHaveURL(/\/havens\?experience=waterfront#collection$/)
})

test("homepage calendar stays above the header while changing months", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop header CTA is hidden at the mobile breakpoint")
  await page.setViewportSize({ width: 1024, height: 760 })
  await page.goto("/")

  await page.locator('button[aria-label^="Arrival,"]').click()
  const dialog = page.getByRole("dialog", { name: "Choose stay dates" })
  const nextMonth = dialog.locator(".rdp-button_next")
  await expect(dialog).toBeVisible()
  await expect(nextMonth).toHaveCount(1)

  const nextMonthBox = await nextMonth.boundingBox()
  expect(nextMonthBox).not.toBeNull()
  const topElementIsInDialog = await page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y)
    return Boolean(element?.closest('[role="dialog"]'))
  }, {
    x: nextMonthBox!.x + nextMonthBox!.width / 2,
    y: nextMonthBox!.y + nextMonthBox!.height / 2,
  })
  expect(topElementIsInDialog).toBe(true)

  const captionsBefore = await dialog.locator(".rdp-caption_label").allTextContents()
  await nextMonth.click()
  await expect(dialog).toBeVisible()
  await expect(dialog.locator(".rdp-caption_label")).not.toHaveText(captionsBefore)
})

test("mobile calendar uses large tap targets and ignores repeated month taps", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile month controls are tested at the mobile breakpoint")
  await page.clock.setFixedTime(new Date("2026-08-14T12:00:00"))
  await page.goto("/havens/reflection-point")
  await page.locator('button[aria-label^="Arrival,"]').click()

  const dialog = page.getByRole("dialog", { name: "Choose stay dates" })
  const nextMonth = dialog.locator(".rdp-button_next")
  const before = await dialog.locator(".rdp-caption_label").allTextContents()
  const box = await nextMonth.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(48)
  expect(box!.height).toBeGreaterThanOrEqual(48)

  await nextMonth.evaluate((button) => {
    ;(button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })
  await expect(dialog.getByTestId("calendar-month-status")).toContainText(/Opening|Viewing/)
  await page.waitForTimeout(350)
  const after = await dialog.locator(".rdp-caption_label").allTextContents()
  expect(before).toEqual(["August 2026"])
  expect(after).toEqual(["September 2026"])
})

test("Full Estate uses the same mobile calendar controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The Full Estate mobile calendar is tested at the mobile breakpoint")
  await page.clock.setFixedTime(new Date("2026-08-14T12:00:00"))
  await page.goto("/havens/whidbey-estate/full-estate")
  await page.locator('button[aria-label^="Arrival,"]').click()
  const estateNext = page.getByRole("dialog", { name: "Choose stay dates" }).locator(".rdp-button_next")
  const estateBox = await estateNext.boundingBox()
  expect(estateBox).not.toBeNull()
  expect(estateBox!.width).toBeGreaterThanOrEqual(48)
  expect(estateBox!.height).toBeGreaterThanOrEqual(48)
})

test("property calendar uses Hostaway availability and minimum-stay rules", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile") await page.emulateMedia({ reducedMotion: "reduce" })
  await page.clock.setFixedTime(new Date("2026-06-13T12:00:00"))
  await mockQuote(page, { total: 2850.4, nights: 2, checkIn: "2026-06-14", checkOut: "2026-06-16", guests: 2 })
  await page.route("**/api/calendar/178403?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        listingId: 178403,
        source: "hostaway",
        calendar: {
          "2026-06-13": { date: "2026-06-13", isAvailable: 0, minimumStay: 2, reservations: [] },
          "2026-06-14": { date: "2026-06-14", isAvailable: 1, minimumStay: 2, countReservedUnits: null, reservations: [] },
          "2026-06-15": { date: "2026-06-15", isAvailable: 1, minimumStay: 2, reservations: [] },
          "2026-06-16": { date: "2026-06-16", isAvailable: 1, minimumStay: 2, reservations: [] },
          "2026-06-17": { date: "2026-06-17", isAvailable: 0, minimumStay: 2, reservations: [{ arrivalDate: "2026-06-17", departureDate: "2026-06-20", status: "confirmed" }] },
        },
      }),
    })
  })
  await page.goto("/havens/emerald-haven#reserve")

  const arrivalTrigger = page.locator('button[aria-label^="Arrival,"]')
  const departureTrigger = page.locator('button[aria-label^="Departure,"]')
  await expect(page.getByTestId("booking-price-prompt")).toBeVisible()
  await expect(page.getByTestId("booking-panel-total")).toHaveCount(0)
  await arrivalTrigger.click()
  await expect(page.getByText("Live availability", { exact: true })).toBeVisible()
  await expect(page.getByTestId("calendar-day-2026-06-13")).toBeDisabled()

  await page.getByTestId("calendar-day-2026-06-14").click()
  await expect(page.getByText("Now choose your departure.", { exact: true })).toBeVisible()
  await expect(page.getByText("2-night minimum. Choose Jun 16 or a later available date.", { exact: true })).toBeVisible()
  await expect(page.getByTestId("calendar-day-2026-06-14")).toHaveClass(/bg-\[\#173c33\]/)
  await expect(page.getByTestId("calendar-day-2026-06-15")).toBeDisabled()
  await expect(page.getByTestId("calendar-day-2026-06-15")).toHaveClass(/text-black\/25/)
  await expect(page.getByTestId("calendar-day-2026-06-16")).toBeEnabled()
  await page.getByTestId("calendar-day-2026-06-16").click()

  await expect(arrivalTrigger).toContainText("Jun 14, 2026")
  await expect(departureTrigger).toContainText("Jun 16, 2026")
  await expect(page.getByTestId("booking-panel-total")).toContainText("$2,850.40")
  await expect(page.getByTestId("booking-send-inquiry")).toBeEnabled()
  await expect(page.getByTestId("booking-book-now")).toBeVisible()

  await departureTrigger.click()
  await expect(page.getByRole("dialog", { name: "Choose stay dates" })).toBeVisible()
  await expect(page.getByText("Now choose your departure.", { exact: true })).toBeVisible()
  await expect(page.getByTestId("calendar-day-2026-06-14")).toHaveClass(/bg-\[\#173c33\]/)
  await expect(page.getByTestId("calendar-day-2026-06-15")).toHaveClass(/bg-\[\#e6ddcb\]/)
  await expect(page.getByTestId("calendar-day-2026-06-16")).toHaveClass(/bg-\[\#173c33\]/)
  await page.getByRole("button", { name: "Clear dates" }).click()
  await expect(page.getByRole("dialog", { name: "Choose stay dates" })).toBeVisible()
  await expect(page.getByText("When would you like to arrive?", { exact: true })).toBeVisible()
  await expect(arrivalTrigger).toContainText("Add date")
  await expect(departureTrigger).toContainText("Add date")
  await expect(page.getByTestId("calendar-day-2026-06-14")).not.toHaveClass(/bg-\[\#173c33\]/)
  await expect(page.getByTestId("calendar-day-2026-06-15")).not.toHaveClass(/bg-\[\#e6ddcb\]/)
  await expect(page.getByTestId("calendar-day-2026-06-16")).not.toHaveClass(/bg-\[\#173c33\]/)
})

test("property calendar keeps one-night Hostaway orphan gaps selectable", async ({ page }, testInfo) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => pageErrors.push(error.message))
  if (testInfo.project.name === "mobile") await page.emulateMedia({ reducedMotion: "reduce" })
  await page.clock.setFixedTime(new Date("2026-06-13T12:00:00"))
  await page.route("**/api/calendar/146889?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        listingId: 146889,
        source: "hostaway",
        calendar: {
          "2026-06-18": { date: "2026-06-18", isAvailable: 1, minimumStay: 1, countReservedUnits: null, reservations: [] },
          "2026-06-19": { date: "2026-06-19", isAvailable: 0, minimumStay: 2, reservations: [{ arrivalDate: "2026-06-19", departureDate: "2026-06-21", status: "confirmed" }] },
          "2026-06-20": { date: "2026-06-20", isAvailable: 0, minimumStay: 2, reservations: [{ arrivalDate: "2026-06-19", departureDate: "2026-06-21", status: "confirmed" }] },
        },
      }),
    })
  })
  await page.goto("/havens/blue-haven#reserve")

  await page.locator('button[aria-label^="Arrival,"]').click()
  await expect(page.getByTestId("calendar-day-2026-06-18")).toBeEnabled()
  await expect(page.getByTestId("calendar-day-2026-06-19")).toBeDisabled()
  await page.getByTestId("calendar-day-2026-06-18").click()
  await expect(page.getByTestId("calendar-day-2026-06-19")).toBeEnabled()
  await expect(page.getByTestId("calendar-day-2026-06-19")).not.toHaveClass(/after:-rotate-45/)
  await expect(page.getByTestId("calendar-day-2026-06-19")).toHaveAttribute("title", "Available for departure")
  await page.getByTestId("calendar-day-2026-06-19").click()

  await expect(page.locator('button[aria-label^="Arrival,"]')).toContainText("Jun 18, 2026")
  await expect(page.locator('button[aria-label^="Departure,"]')).toContainText("Jun 19, 2026")
  expect(pageErrors).toEqual([])
})

test("Emerald Haven checkout remains responsive with a production-sized mobile calendar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile WebKit regression")
  await page.clock.setFixedTime(new Date("2027-02-01T12:00:00"))
  const calendar: Record<string, { date: string; isAvailable: number; minimumStay: number; reservations: never[] }> = {}
  const cursor = new Date("2027-02-01T12:00:00Z")
  for (let day = 0; day < 560; day += 1) {
    const date = cursor.toISOString().slice(0, 10)
    calendar[date] = { date, isAvailable: 1, minimumStay: 4, reservations: [] }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  await page.route("**/api/calendar/178403?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ listingId: 178403, source: "hostaway", calendar }),
    })
  })
  await page.goto("/havens/emerald-haven#reserve")

  await page.locator('button[aria-label^="Arrival,"]').click()
  await page.getByTestId("calendar-day-2027-02-09").click()
  await expect(page.getByText("4-night minimum. Choose Feb 13 or a later available date.", { exact: true })).toBeVisible()
  await expect(page.getByTestId("calendar-day-2027-02-12")).toBeDisabled()
  await expect(page.getByTestId("calendar-day-2027-02-14")).toBeEnabled()

  const checkoutStarted = Date.now()
  await page.getByTestId("calendar-day-2027-02-14").click()
  expect(Date.now() - checkoutStarted).toBeLessThan(1_500)
  await expect(page.getByRole("dialog", { name: "Choose stay dates" })).toBeHidden()
  await expect(page.locator('button[aria-label^="Arrival,"]')).toContainText("Feb 9, 2027")
  await expect(page.locator('button[aria-label^="Departure,"]')).toContainText("Feb 14, 2027")
})

test("collection rescues large groups without relisting The Cove Club", async ({ page }) => {
  await page.goto("/havens")
  const guestFilter = page.getByRole("group", { name: "Filter by guests" })
  for (let count = 1; count < 16; count += 1) await guestFilter.getByRole("button", { name: "Increase guest count" }).click()
  await expect(page.locator("article").filter({ hasText: "The Cove Club" })).toHaveCount(0)
  await expect(page.getByRole("link", { name: "Plan a Cove Club Stay" })).toBeVisible()
})

test("search submission disables repeat clicks and lands on a clear result state", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-06-13T12:00:00"))
  await page.route("**/api/search", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ results: [{ propertySlug: "emerald-haven", availableListingIds: [178403] }] }),
    })
  })
  await page.goto("/")

  await page.locator('button[aria-label^="Arrival,"]').click()
  await page.getByTestId("calendar-day-2026-06-14").click()
  await page.getByTestId("calendar-day-2026-06-16").click()

  const searchButton = page.getByTestId("search-stays")
  await searchButton.click()
  await expect(searchButton).toBeDisabled()
  await expect(searchButton).toContainText("Searching...")
  await expect(page).toHaveURL(/\/havens\?checkIn=2026-06-14&checkOut=2026-06-16&guests=2#collection/, { timeout: 15_000 })
  await expect(page.getByTestId("availability-results-status")).toContainText("Checking live availability for your stay...")
  await expect(page.getByTestId("availability-results-status")).toContainText("1 stay available for Jun 14–Jun 16, 2026 · 2 guests")
})

test("collection search preserves dates and provides a path back to browsing", async ({ page }) => {
  await page.route("**/api/search", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ results: [{ propertySlug: "emerald-haven", availableListingIds: [178403] }] }),
    })
  })
  await page.goto("/havens?checkIn=2026-09-01&checkOut=2026-09-04&guests=4")

  await expect(page.locator('button[aria-label^="Arrival,"]')).toContainText("Sep 1, 2026")
  await expect(page.locator('button[aria-label^="Departure,"]')).toContainText("Sep 4, 2026")
  await expect(page.getByRole("group", { name: "Search guests" })).toContainText("4 guests")
  await expect(page.getByText("1 stay available for Sep 1–Sep 4, 2026 · 4 guests")).toBeVisible()
  await expect(page.getByRole("link", { name: "Browse without dates" })).toHaveAttribute("href", "/havens#collection")
  await expect(page.locator('#collection a[href^="/havens/emerald-haven?"]')).toHaveAttribute("href", "/havens/emerald-haven?checkIn=2026-09-01&checkOut=2026-09-04&guests=4")
})

test("collection results carry dates and campaign attribution into a Haven", async ({ page }) => {
  await page.route("**/api/search", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ results: [{ propertySlug: "emerald-haven", availableListingIds: [178403] }] }),
    })
  })
  await mockQuote(page, { total: 4138.4, nights: 3, checkIn: "2026-09-01", checkOut: "2026-09-04", guests: 4 })
  await page.goto("/havens?checkIn=2026-09-01&checkOut=2026-09-04&guests=4&utm_source=instagram#collection")

  const resultLink = page.locator('#collection a[href^="/havens/emerald-haven?"]')
  await expect(resultLink).toHaveAttribute("href", "/havens/emerald-haven?checkIn=2026-09-01&checkOut=2026-09-04&guests=4&utm_source=instagram")
  await resultLink.click()

  await expect(page).toHaveURL(/\/havens\/emerald-haven\?checkIn=2026-09-01&checkOut=2026-09-04&guests=4&utm_source=instagram/)
  await expect(page.locator('button[aria-label^="Arrival,"]')).toContainText("Sep 1, 2026")
  await expect(page.locator('button[aria-label^="Departure,"]')).toContainText("Sep 4, 2026")
  await expect(page.getByRole("group", { name: "Reservation guests" })).toContainText("4 guests")
})

test("collection keeps result cards stable until live availability resolves", async ({ page }) => {
  let releaseSearch = () => {}
  const searchGate = new Promise<void>((resolve) => {
    releaseSearch = resolve
  })
  await page.route("**/api/search", async (route) => {
    await searchGate
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ results: [{ propertySlug: "emerald-haven", availableListingIds: [178403] }] }),
    })
  })
  await page.goto("/havens?checkIn=2026-09-01&checkOut=2026-09-04&guests=4&utm_source=instagram#collection")

  await expect(page.getByTestId("availability-loading-results")).toBeVisible()
  await expect(page.locator('#collection a[href^="/havens/emerald-haven?"]')).toHaveCount(0)

  releaseSearch()
  const resultLink = page.locator('#collection a[href^="/havens/emerald-haven?"]')
  await expect(resultLink).toBeVisible()
  await resultLink.click()
  await expect(page).toHaveURL(/\/havens\/emerald-haven\?checkIn=2026-09-01&checkOut=2026-09-04&guests=4&utm_source=instagram/)
})

test("collection search expands matching Cove Club residences", async ({ page }) => {
  await page.route("**/api/search", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        results: [{
          propertySlug: "whidbey-estate",
          availableListingIds: [571917, 558678],
          variants: [
            { listingId: 571917, variantSlug: "guest-house", quote: { total: 2400, currency: "USD", nights: 4 } },
            { listingId: 558678, variantSlug: "main-house", quote: { total: 5000, currency: "USD", nights: 4 } },
          ],
        }],
      }),
    })
  })
  await page.goto("/havens?checkIn=2027-04-15&checkOut=2027-04-19&guests=5")

  const results = page.locator("#collection")
  await expect(results.getByText("2 private stays")).toBeVisible()
  await expect(results.getByRole("heading", { name: "The Guest House" })).toBeVisible()
  await expect(results.getByRole("heading", { name: "The Main House" })).toBeVisible()
  const guestHouseCard = results.locator("article").filter({ hasText: "The Guest House" })
  await expect(guestHouseCard.getByText("$2,400.00", { exact: true })).toBeVisible()
  await expect(guestHouseCard.getByText("Complete total · 4 nights", { exact: true })).toBeVisible()
  await expect(results.getByRole("heading", { name: "The Cove Club" })).toHaveCount(0)
  await expect(results.getByRole("link", { name: /The Guest House/ })).toHaveAttribute("href", "/havens/whidbey-estate/guest-house?checkIn=2027-04-15&checkOut=2027-04-19&guests=5")
  await expect(results.getByRole("link", { name: /The Main House/ })).toHaveAttribute("href", "/havens/whidbey-estate/main-house?checkIn=2027-04-15&checkOut=2027-04-19&guests=5")
})

test("legacy Hostaway listing URLs permanently redirect with stay and campaign parameters", async ({ page }) => {
  const legacyDestinations = [
    [146889, "/havens/blue-haven"],
    [157299, "/havens/sea-renity-haven"],
    [178403, "/havens/emerald-haven"],
    [178994, "/havens/fair-haven"],
    [184081, "/havens/aurora-haven"],
    [335403, "/havens/reflection-haven"],
    [558675, "/havens/whidbey-estate/lighthouse"],
    [571917, "/havens/whidbey-estate/guest-house"],
    [558676, "/havens/whidbey-estate/lodge"],
    [558677, "/havens/whidbey-estate/full-estate"],
    [558678, "/havens/whidbey-estate/main-house"],
    [576478, "/havens/reflection-point"],
  ] as const

  for (const [listingId, destination] of legacyDestinations) {
    const response = await page.request.get(`/listings/${listingId}?utm_source=legacy`, { maxRedirects: 0 })
    expect(response.status(), String(listingId)).toBe(308)
    expect(response.headers().location, String(listingId)).toContain(`${destination}?utm_source=legacy`)
  }

  const legacyUrl = "/listings/146889?startDate=2027-04-15&endDate=2027-04-19&numberOfGuests=5&utm_source=instagram"
  const redirect = await page.request.get(legacyUrl, { maxRedirects: 0 })
  expect(redirect.status()).toBe(308)
  expect(redirect.headers().location).toContain("/havens/blue-haven?")

  await page.goto(legacyUrl)

  await expect(page).toHaveURL(/\/havens\/blue-haven\?checkIn=2027-04-15&checkOut=2027-04-19&guests=5&utm_source=instagram/)
  expect(page.url()).not.toContain("startDate")
  expect(page.url()).not.toContain("numberOfGuests")
  await expect(page.locator('button[aria-label^="Arrival,"]')).toContainText("Apr 15, 2027")
  await expect(page.locator('button[aria-label^="Departure,"]')).toContainText("Apr 19, 2027")
})

test("property inquiry handoff carries the stay and returns to the booking panel", async ({ page }) => {
  await page.goto("/havens/reflection-point?checkIn=2026-09-18&checkOut=2026-09-23&guests=4#reserve")
  await page.getByTestId("booking-send-inquiry").click()

  await expect(page.getByRole("heading", { name: "Request Reflection Point." })).toBeVisible()
  await expect(page.getByTestId("inquiry-stay-context")).toContainText("Sep 18–Sep 23, 2026 · 4 guests")
  await expect(page.getByLabel("Tell us about the stay")).toHaveValue(/Reflection Point[\s\S]*Sep 18–Sep 23, 2026[\s\S]*Guests: 4/)

  await page.getByRole("link", { name: "Adjust stay" }).click()
  await expect(page).toHaveURL(/\/havens\/reflection-point\?checkIn=2026-09-18&checkOut=2026-09-23&guests=4#reserve/)
  await expect(page.locator('button[aria-label^="Arrival,"]')).toContainText("Sep 18, 2026")
  await expect(page.locator('button[aria-label^="Departure,"]')).toContainText("Sep 23, 2026")
})

test("mobile Choose dates opens and focuses the calendar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The sticky date CTA is mobile-only")
  await page.goto("/havens/blue-haven")

  const chooseDates = page.getByRole("button", { name: "Choose dates" })
  await chooseDates.click()
  const dialog = page.getByRole("dialog", { name: "Choose stay dates" })
  await expect(dialog).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true)
})

test("property gallery appears before the listing details", async ({ page }) => {
  await page.goto("/havens/blue-haven")

  const [galleryBox, detailsBox] = await Promise.all([
    page.locator("#gallery").boundingBox(),
    page.getByRole("heading", { name: "About Blue Haven." }).boundingBox(),
  ])
  expect(galleryBox).not.toBeNull()
  expect(detailsBox).not.toBeNull()
  expect(galleryBox!.y).toBeLessThan(detailsBox!.y)
})

test("guest count controls use the shared stepper throughout the booking journey", async ({ page }) => {
  const placements = [
    { url: "/", label: "Search guests" },
    { url: "/havens", label: "Filter by guests" },
    { url: "/havens/blue-haven#reserve", label: "Reservation guests" },
    { url: "/booking/blue-haven?variant=blue-haven&checkIn=2026-06-18&checkOut=2026-06-19&guests=2", label: "Checkout guests" },
  ]

  for (const placement of placements) {
    await page.goto(placement.url)
    const control = page.getByRole("group", { name: placement.label })
    await expect(control).toBeVisible()
    await expect(control.getByRole("button", { name: "Decrease guest count" })).toBeVisible()
    await expect(control.getByRole("button", { name: "Increase guest count" })).toBeVisible()
  }
})

test("checkout guest control aligns with the stay date control", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Checkout controls intentionally stack on mobile")
  await page.goto("/booking/blue-haven?variant=blue-haven&checkIn=2026-06-18&checkOut=2026-06-19&guests=2")

  const [datesBox, guestsBox] = await Promise.all([
    page.locator('[data-availability-source] > div').boundingBox(),
    page.getByRole("group", { name: "Checkout guests" }).boundingBox(),
  ])

  expect(datesBox).not.toBeNull()
  expect(guestsBox).not.toBeNull()
  expect(Math.abs(datesBox!.y - guestsBox!.y)).toBeLessThanOrEqual(1)
  expect(Math.abs(datesBox!.height - guestsBox!.height)).toBeLessThanOrEqual(1)
})

test("property page links into booking", async ({ page }) => {
  await page.goto("/havens/emerald-haven")
  await expect(page.getByRole("heading", { name: "Emerald Haven", level: 1, exact: true })).toBeVisible()
  await expect(page.getByTestId("booking-price-prompt")).toBeVisible()
  await expect(page.getByTestId("booking-send-inquiry")).toBeVisible()
  await expect(page.getByTestId("booking-book-now")).toBeDisabled()
  await expect(page.getByRole("button", { name: "View the complete Emerald Haven gallery" })).toBeVisible()
})

test("property reserve card stays concise", async ({ page }) => {
  await page.goto("/havens/blue-haven#reserve")

  const panel = page.locator("#reserve")
  const directBookingNote = panel.getByText("Secure direct booking with personal support from Enchanted Havens.")
  const [panelBox, noteBox] = await Promise.all([panel.boundingBox(), directBookingNote.boundingBox()])

  expect(panelBox).not.toBeNull()
  expect(noteBox).not.toBeNull()
  expect(panelBox!.height).toBeLessThan(850)
  expect(panelBox!.y + panelBox!.height - (noteBox!.y + noteBox!.height)).toBeLessThan(60)
})

test("property gallery opens and closes from the keyboard", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile") await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/havens/emerald-haven")
  await page.getByRole("button", { name: "View the complete Emerald Haven gallery" }).click()
  await expect(page.getByRole("dialog", { name: "Emerald Haven gallery" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Emerald Haven gallery" })).toBeHidden()
})

test("property gallery provides working image navigation", async ({ page }) => {
  await page.goto("/havens/blue-haven")
  await page.getByRole("button", { name: "View the complete Blue Haven gallery" }).click()

  const dialog = page.getByRole("dialog", { name: "Blue Haven gallery" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByTestId("gallery-photo-count")).toContainText("Photograph 1 of")
  await dialog.getByTestId("gallery-active-image").click()
  await expect(dialog.getByTestId("gallery-photo-count")).toContainText("Photograph 2 of")
  await page.keyboard.press("ArrowLeft")
  await expect(dialog.getByTestId("gallery-photo-count")).toContainText("Photograph 1 of")
})

test("every visual-tour surface opens the property gallery", async ({ page }) => {
  await page.goto("/havens/blue-haven")
  const previews = page.getByRole("button", { name: "Open Blue Haven image gallery in Port Angeles, Washington", exact: true })
  await expect(previews).toHaveCount(3)
  await expect(previews.nth(1)).toContainText("Open gallery")
  await previews.nth(1).click()
  await expect(page.getByRole("dialog", { name: "Blue Haven gallery" })).toBeVisible()
  await page.keyboard.press("Escape")

  await page.getByRole("button", { name: "View the complete Blue Haven gallery" }).click()
  await expect(page.getByRole("dialog", { name: "Blue Haven gallery" })).toBeVisible()
})

test("estate residence uses the Hostaway cover before gallery photos 2 through 4", async ({ page }, testInfo) => {
  const galleryResponse = await page.request.get("/api/gallery/558678")
  expect(galleryResponse.ok()).toBe(true)
  const { images } = await galleryResponse.json() as { images: string[] }
  expect(images.length).toBeGreaterThanOrEqual(4)

  await page.goto("/havens/whidbey-estate/main-house")

  const previews = page.locator("#gallery").getByRole("button", { name: /Open The Main House image gallery/ }).locator("img")
  const previewCount = 3
  await expect(previews).toHaveCount(previewCount)
  for (const [index, image] of images.slice(1, previewCount + 1).entries()) {
    await expect.poll(async () => decodeURIComponent((await previews.nth(index).getAttribute("src")) || "")).toContain(image)
  }

  if (testInfo.project.name === "mobile") return

  await page.getByRole("button", { name: "View the complete The Main House gallery" }).click()
  const fullGallery = page.getByRole("dialog", { name: "The Main House gallery" })
  await expect(fullGallery.getByTestId("gallery-photo-count")).toContainText(`Photograph 1 of ${images.length}`)
  await expect.poll(async () => decodeURIComponent((await fullGallery.getByTestId("gallery-active-image").locator("img").getAttribute("src")) || "")).toContain(images[0])
})

test("Lighthouse uses the Hostaway cover before gallery photos 2 through 4", async ({ page }, testInfo) => {
  const galleryResponse = await page.request.get("/api/gallery/558675")
  expect(galleryResponse.ok()).toBe(true)
  const { images } = await galleryResponse.json() as { images: string[] }
  expect(images.length).toBeGreaterThanOrEqual(4)

  await page.goto("/havens/whidbey-estate/lighthouse")

  const previews = page.locator("#gallery").getByRole("button", { name: /Open The Lighthouse image gallery/ }).locator("img")
  const previewCount = 3
  await expect(previews).toHaveCount(previewCount)
  for (const [index, image] of images.slice(1, previewCount + 1).entries()) {
    await expect.poll(async () => decodeURIComponent((await previews.nth(index).getAttribute("src")) || "")).toContain(image)
  }

  if (testInfo.project.name === "mobile") return

  await page.getByRole("button", { name: "View the complete The Lighthouse gallery" }).click()
  const fullGallery = page.getByRole("dialog", { name: "The Lighthouse gallery" })
  await expect(fullGallery.getByTestId("gallery-photo-count")).toContainText(`Photograph 1 of ${images.length}`)
  await expect.poll(async () => decodeURIComponent((await fullGallery.getByTestId("gallery-active-image").locator("img").getAttribute("src")) || "")).toContain(images[0])
})

test("Lodge uses the selected Hostaway residence image as its banner", async ({ page }) => {
  await page.goto("/havens/whidbey-estate/lodge")
  const cover = page.locator("#gallery").getByRole("button", { name: /Open The Lodge image gallery/ }).locator("img").first()
  await expect.poll(async () => decodeURIComponent((await cover.getAttribute("src")) || "")).toContain(
    "57690-558676-3MeQ0x357poeQsFcEcOSlWypqdnRdS82TYU2g--LoV8Q-6a38d6a602ab6",
  )
})

test("mobile navigation presents the full brand journey", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation is only rendered below the desktop breakpoint")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.getByRole("button", { name: "Open navigation" }).click()
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" })
  await expect(navigation).toBeVisible()
  await expect(navigation.getByRole("link", { name: "The Havens" })).toBeVisible()
  await expect(navigation.getByRole("link", { name: "Contact" })).toBeVisible()
})

test("booking stays native and never redirects to the Hostaway portal", async ({ page }) => {
  await mockQuote(page, { total: 4138.4, nights: 3, checkIn: "2026-09-01", checkOut: "2026-09-04", guests: 4 })
  await page.goto("/booking/emerald-haven?variant=emerald-haven&checkIn=2026-09-01&checkOut=2026-09-04&guests=4")
  await expect(page.getByRole("heading", { name: "Reserve Emerald Haven" })).toBeVisible()
  await expect(page.getByTestId("checkout-total")).toContainText("$4,138.40")
  await expect(page.getByRole("heading", { name: "Guest and payment details" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Card information" })).toBeVisible()
  await expect(page.getByTestId("complete-booking")).toHaveCount(1)
  await expect(page.getByRole("button", { name: "Continue to Secure Card" })).toHaveCount(0)
  await expect(page.locator('input[name="address"], input[name="city"], input[name="state"], input[name="zipCode"]')).toHaveCount(0)
  await expect(page.locator("main").locator('a[href*="book.enchantedhavens.com"]')).toHaveCount(0)
  await expect(page.getByRole("link", { name: "Send Inquiry" })).toBeVisible()
})

test("collection cards keep prices hidden until dates are selected", async ({ page }) => {
  await page.goto("/havens")
  await expect(page.getByText("Select dates for exact pricing").first()).toBeVisible()
  await expect(page.getByText(/\/ night/i)).toHaveCount(0)
  await expect(page.locator("article").filter({ hasText: "The Cove Club" })).toHaveCount(0)
})

test("The Cove Club is an editorial hub for all four residences", async ({ page }) => {
  await page.goto("/havens/whidbey-estate")
  await expect(page.getByRole("heading", { name: "The Cove Club", level: 1 })).toBeVisible()
  for (const residence of ["The Full Estate", "The Lighthouse", "The Lodge", "The Main House"]) {
    await expect(page.getByRole("link", { name: new RegExp(residence) }).first()).toBeVisible()
  }

  const card = page.getByTestId("estate-residence-full-estate")
  const content = page.getByTestId("estate-residence-content-full-estate")
  const [cardBox, contentBox] = await Promise.all([card.boundingBox(), content.boundingBox()])
  expect(cardBox).not.toBeNull()
  expect(contentBox).not.toBeNull()
  expect(contentBox!.y).toBeGreaterThanOrEqual(cardBox!.y)
  expect(contentBox!.y + contentBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height)
})

test("all public pages preserve visual layout integrity", async ({ page }) => {
  const routes = [
    "/", "/havens", "/havens/blue-haven", "/havens/sea-renity-haven", "/havens/emerald-haven",
    "/havens/fair-haven", "/havens/aurora-haven", "/havens/reflection-haven", "/havens/whidbey-estate",
    "/havens/whidbey-estate/lighthouse", "/havens/whidbey-estate/lodge", "/havens/whidbey-estate/full-estate",
    "/havens/whidbey-estate/main-house", "/experiences", "/story", "/contact", "/privacy", "/terms",
    "/amenities", "/amenities/washington-hot-tub-vacation-rentals",
  ]
  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator("h1")).toBeVisible()
    const integrity = await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      brokenImages: [...document.images].filter((image) => image.currentSrc && image.complete && image.naturalWidth === 0).length,
    }))
    expect(integrity, route).toEqual({ horizontalOverflow: false, brokenImages: 0 })
  }
})

test("reduced motion removes decorative animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  const duration = await page.locator(".hero-reveal").evaluate((element) => getComputedStyle(element).animationDuration)
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.01)
})

test("missing routes retain the Enchanted Havens experience", async ({ page }) => {
  const response = await page.goto("/a-haven-that-does-not-exist")
  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { name: "This path does not lead to a haven." })).toBeVisible()
  await expect(page.getByRole("link", { name: "Explore the Collection" })).toBeVisible()
})
