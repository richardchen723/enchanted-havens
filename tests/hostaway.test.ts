import { afterEach, describe, expect, it, vi } from "vitest"
import { buildCheckoutValidityMap, buildNextArrivalMap, canSelectCheckIn, canSelectCheckOut, getCalendarDateInfo, normalizeHostawayCalendarResult, shouldShowCheckoutOnlyCue } from "@/lib/calendar"
import { calendarCoversStay, createHostawayReservation, findHostawayReservationByReference, normalizeHostawayListingResult, normalizeHostawayQuoteResult, normalizeHostawayReviewResults } from "@/lib/hostaway"

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.HOSTAWAY_ACCESS_TOKEN
})

describe("Hostaway normalization", () => {
  it("normalizes nested listing resources and image order", () => {
    const variant = normalizeHostawayListingResult({
      listing: { id: 178403, name: "Emerald Haven: Lake", city: "Port Angeles", state: "Washington", personCapacity: 10, bedroomsNumber: 5, bathroomsNumber: 2, currencyCode: "USD", price: 600, averageReviewRating: 497 },
      listingImage: [{ url: "https://example.com/two.jpg", sortOrder: 2 }, { url: "https://example.com/one.jpg", sortOrder: 1 }],
      listingAmenity: [{ isPresent: 1, amenity: { name: "Hot tub" } }, { isPresent: 0, amenity: { name: "Pool" } }],
      reviewsCount: 12,
    }, 178403)
    expect(variant.images).toEqual(["https://example.com/one.jpg", "https://example.com/two.jpg"])
    expect(variant.amenities).toEqual(["Hot tub"])
    expect(variant.guests).toBe(10)
    expect(variant.rating).toBe(4.97)
  })

  it("normalizes the live Hostaway amenity shape, description, and map coordinates", () => {
    const variant = normalizeHostawayListingResult({
      listing: {
        id: 146889,
        name: "Blue Haven",
        description: "A complete Hostaway listing description.",
        lat: "48.07339881",
        lng: "-123.69492239",
        listingAmenities: [
          { amenityName: "Waterfront" },
          { amenityName: "Private dock" },
          { amenityName: "Waterfront" },
        ],
      },
    }, 146889)

    expect(variant.fullDescription).toBe("A complete Hostaway listing description.")
    expect(variant.latitude).toBeCloseTo(48.07339881)
    expect(variant.longitude).toBeCloseTo(-123.69492239)
    expect(variant.amenities).toEqual(["Waterfront", "Private dock"])
  })

  it("uses Hostaway bathroomsNumber for the public bath count", () => {
    const variant = normalizeHostawayListingResult({
      listing: {
        id: 157299,
        name: "Sea-Renity Haven",
        personCapacity: 12,
        bedroomsNumber: 4,
        bathroomsNumber: 2,
        guestBathroomsNumber: 1,
      },
    }, 157299)

    expect(variant.bathrooms).toBe(2)
  })

  it("derives combined-estate capacity from Hostaway bed inventory", () => {
    const variant = normalizeHostawayListingResult({
      listing: {
        id: 558677,
        name: "23 Acres Gated Oceanfront Estate on Whidbey Island",
        personCapacity: 16,
        bedroomsNumber: 19,
        bathroomsNumber: 19,
        listingBedTypes: [
          { quantity: 4 },
          { quantity: 1 },
          ...Array.from({ length: 10 }, () => ({ quantity: 1 })),
          ...Array.from({ length: 6 }, () => ({ quantity: 1 })),
        ],
      },
    }, 558677)

    expect(variant.guests).toBe(42)
  })

  it("normalizes Hostaway percentage ratings without reducing 99 to 0.99", () => {
    const variant = normalizeHostawayListingResult({
      listing: {
        id: 178403,
        name: "Emerald Haven",
        averageReviewRating: 99,
      },
    }, 178403)

    expect(variant.rating).toBe(4.95)
  })

  it("normalizes the ten-point rating scale used by live Hostaway listings", () => {
    const variant = normalizeHostawayListingResult({
      listing: {
        id: 178403,
        name: "Emerald Haven",
        averageReviewRating: 9.9,
      },
    }, 178403)

    expect(variant.rating).toBe(4.95)
  })

  it("normalizes live Hostaway review ratings to the five-point public scale", () => {
    const reviews = normalizeHostawayReviewResults([
      { id: 1, guestName: "Avery", rating: 10, publicReview: "Beautiful stay by the water.", departureDate: "2026-06-01" },
      { id: 2, guestName: "Jordan", rating: 98, publicReview: "Excellent house and view.", departureDate: "2026-06-02" },
    ], "Sea-Renity Haven")

    expect(reviews.map((review) => review.rating)).toEqual([5, 4.9])
    expect(reviews.every((review) => review.rating <= 5)).toBe(true)
    expect(reviews[0]).toMatchObject({ propertyName: "Sea-Renity Haven", guestName: "Avery" })
  })

  it("preserves booking-engine markup, taxes, and guest service fees", () => {
    const quote = normalizeHostawayQuoteResult({
      totalPrice: 5010.74,
      components: [
        { type: "accommodation", name: "baseRate", title: "Base rate", value: 4250.4, total: 4250.4, isIncludedInTotalPrice: 1 },
        { type: "fee", name: "cleaningFee", title: "Cleaning fee", value: 200, total: 200, isIncludedInTotalPrice: 1 },
        { type: "tax", name: "lodgingTax", title: "Lodging tax", value: 480.23, total: 480.23, isIncludedInTotalPrice: 1 },
        { type: "commissions", name: "guestChannelFee", title: "Guest Service Fee", value: 80.11, total: 80.11, isIncludedInTotalPrice: 1 },
      ],
    }, 178403, "2026-06-30", "2026-07-03", 2)

    expect(quote.total).toBe(5010.74)
    expect(quote.nights).toBe(3)
    expect(quote.components.map((component) => component.name)).toEqual(["baseRate", "cleaningFee", "lodgingTax", "guestChannelFee"])
    expect(quote.components.reduce((sum, component) => sum + component.total, 0)).toBeCloseTo(5010.74, 2)
  })
})

describe("Hostaway reservation writes", () => {
  it("uses the booking reference as Hostaway's queryable idempotency key", async () => {
    process.env.HOSTAWAY_ACCESS_TOKEN = "hostaway-test-token"
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      status: "success",
      result: { id: 987654 },
    }), { status: 200, headers: { "Content-Type": "application/json" } }))

    await createHostawayReservation({
      listingMapId: 444,
      checkIn: "2026-09-10",
      checkOut: "2026-09-13",
      guests: 4,
      guest: { firstName: "Avery", lastName: "Guest", email: "avery@example.com", phone: "2065550100" },
      quote: {
        listingId: 178403,
        checkIn: "2026-09-10",
        checkOut: "2026-09-13",
        guests: 4,
        nights: 3,
        total: 2100,
        currency: "USD",
        available: true,
        components: [{ type: "price", name: "baseRate", title: "Base rate", value: 2100, total: 2100 }],
      },
      bookingReference: "8a974a65-c5d7-47e6-9846-076ef4f04234",
    })

    const [url, request] = fetchMock.mock.calls[0]
    const body = JSON.parse(String(request?.body))
    expect(String(url)).toBe("https://api.hostaway.com/v1/reservations")
    expect(body).toMatchObject({
      channelId: 2000,
      listingMapId: 444,
      customerUserId: "8a974a65-c5d7-47e6-9846-076ef4f04234",
      phone: "+12065550100",
      isPaid: 0,
      financeField: [{ name: "baseRate", total: 2100 }],
    })
    expect(body).not.toHaveProperty("forceOverbooking")
  })

  it("links the saved Stripe customer to an unpaid Hostaway reservation", async () => {
    process.env.HOSTAWAY_ACCESS_TOKEN = "hostaway-test-token"
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      status: "success",
      result: { id: 987654 },
    }), { status: 200, headers: { "Content-Type": "application/json" } }))

    await createHostawayReservation({
      listingMapId: 444,
      checkIn: "2026-09-10",
      checkOut: "2026-09-13",
      guests: 4,
      guest: { firstName: "Avery", lastName: "Guest", email: "avery@example.com", phone: "2065550100" },
      quote: {
        listingId: 178403,
        checkIn: "2026-09-10",
        checkOut: "2026-09-13",
        guests: 4,
        nights: 3,
        total: 2100,
        currency: "USD",
        available: true,
        components: [],
      },
      bookingReference: "8a974a65-c5d7-47e6-9846-076ef4f04234",
      stripeCustomerId: "cus_123",
    })

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body).toMatchObject({
      isPaid: 0,
      paymentMethod: "credit_card",
      stripeGuestId: "cus_123",
    })
    expect(body.comment).toContain("no payment collected")
    expect(body.comment).toContain("charge the saved payment method manually")
  })

  it("finds an active reservation by the booking-session reference", async () => {
    process.env.HOSTAWAY_ACCESS_TOKEN = "hostaway-test-token"
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      status: "success",
      result: [
        { id: 10, customerUserId: "different-reference", status: "new" },
        {
          id: 987654,
          customerUserId: "8a974a65-c5d7-47e6-9846-076ef4f04234",
          status: "new",
          arrivalDate: "2026-09-10",
          departureDate: "2026-09-13",
          guestEmail: "avery@example.com",
        },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } }))

    const reservation = await findHostawayReservationByReference({
      bookingReference: "8a974a65-c5d7-47e6-9846-076ef4f04234",
      listingId: 178403,
      checkIn: "2026-09-10",
      checkOut: "2026-09-13",
      guestEmail: "avery@example.com",
    })

    expect(reservation).toEqual({ id: 987654, status: "new" })
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]))
    expect(requestUrl.searchParams.get("customerUserId")).toBe("8a974a65-c5d7-47e6-9846-076ef4f04234")
    expect(requestUrl.searchParams.get("listingId")).toBe("178403")
  })

  it("does not reconcile a cancelled Hostaway reservation", async () => {
    process.env.HOSTAWAY_ACCESS_TOKEN = "hostaway-test-token"
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      status: "success",
      result: [{
        id: 987654,
        customerUserId: "8a974a65-c5d7-47e6-9846-076ef4f04234",
        status: "cancelled",
        arrivalDate: "2026-09-10",
        departureDate: "2026-09-13",
        guestEmail: "avery@example.com",
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }))

    await expect(findHostawayReservationByReference({
      bookingReference: "8a974a65-c5d7-47e6-9846-076ef4f04234",
      listingId: 178403,
      checkIn: "2026-09-10",
      checkOut: "2026-09-13",
      guestEmail: "avery@example.com",
    })).resolves.toBeNull()
  })
})

describe("calendar availability", () => {
  it("requires every occupied night to be available", () => {
    const calendar = [
      { date: "2026-07-01", isAvailable: 1 },
      { date: "2026-07-02", isAvailable: 1 },
      { date: "2026-07-03", isAvailable: 0 },
    ]
    expect(calendarCoversStay(calendar, "2026-07-01", "2026-07-03")).toBe(true)
    expect(calendarCoversStay(calendar, "2026-07-01", "2026-07-04")).toBe(false)
  })

  it("normalizes nullable Hostaway inventory and allows departure on the next reservation arrival", () => {
    const rawCalendar = [
      { date: "2026-07-10", isAvailable: "1", minimumStay: "2", countReservedUnits: null, countBlockingReservations: null },
      { date: "2026-07-11", isAvailable: 1 },
      { date: "2026-07-12", isAvailable: 0, reservations: [{ arrivalDate: "2026-07-12", departureDate: "2026-07-15", status: "confirmed", guestName: "Private Guest", guestEmail: "private@example.com" }] },
      { date: "2026-07-13", isAvailable: 0, reservations: [{ arrivalDate: "2026-07-12", departureDate: "2026-07-15", status: "confirmed" }] },
    ]
    const calendar = normalizeHostawayCalendarResult(rawCalendar)

    expect(calendar["2026-07-10"].isAvailable).toBe(1)
    expect(calendar["2026-07-10"].minimumStay).toBe(2)
    expect(calendar["2026-07-10"].countReservedUnits).toBeNull()
    expect(calendar["2026-07-12"].reservations[0]).toEqual({ arrivalDate: "2026-07-12", departureDate: "2026-07-15", status: "confirmed" })
    expect(calendarCoversStay(rawCalendar, "2026-07-10", "2026-07-12")).toBe(true)
    expect(calendarCoversStay(rawCalendar, "2026-07-10", "2026-07-13")).toBe(false)
    expect(getCalendarDateInfo(new Date("2026-07-12T00:00:00"), calendar).status).toBe("solid-block")
  })

  it("uses the orphan date's one-night minimum instead of the surrounding policy", () => {
    const calendar = normalizeHostawayCalendarResult([
      { date: "2026-06-18", isAvailable: 1, minimumStay: 1, countReservedUnits: null },
      { date: "2026-06-19", isAvailable: 0, minimumStay: 2, reservations: [{ arrivalDate: "2026-06-19", departureDate: "2026-06-21" }] },
    ])
    const nextArrivals = buildNextArrivalMap(calendar)

    expect(canSelectCheckIn(new Date("2026-06-18T00:00:00"), calendar, nextArrivals)).toBe(true)
    expect(canSelectCheckOut(new Date("2026-06-18T00:00:00"), new Date("2026-06-19T00:00:00"), calendar)).toBe(true)
    expect(getCalendarDateInfo(new Date("2026-06-19T00:00:00"), calendar, nextArrivals).status).toBe("solid-block")
  })

  it("prevents a check-in that cannot satisfy the Hostaway minimum stay before the next arrival", () => {
    const calendar = normalizeHostawayCalendarResult([
      { date: "2026-08-01", isAvailable: 1, minimumStay: 3 },
      { date: "2026-08-02", isAvailable: 1 },
      { date: "2026-08-03", isAvailable: 0, reservations: [{ arrivalDate: "2026-08-03", departureDate: "2026-08-06" }] },
    ])
    const nextArrivals = buildNextArrivalMap(calendar)

    expect(canSelectCheckIn(new Date("2026-08-01T00:00:00"), calendar, nextArrivals)).toBe(false)
    expect(getCalendarDateInfo(new Date("2026-08-01T00:00:00"), calendar, nextArrivals).reason).toContain("3-night")
  })

  it("does not mute a checkout-only date once it is a valid departure choice", () => {
    const calendar = normalizeHostawayCalendarResult([
      { date: "2026-08-11", isAvailable: 1, minimumStay: 2 },
      { date: "2026-08-12", isAvailable: 1 },
      { date: "2026-08-13", isAvailable: 1, minimumStay: 2 },
      { date: "2026-08-14", isAvailable: 0, reservations: [{ arrivalDate: "2026-08-14", departureDate: "2026-08-16", status: "confirmed" }] },
    ])
    const nextArrivals = buildNextArrivalMap(calendar)
    const checkoutOnlyDate = new Date("2026-08-13T00:00:00")
    const selectedArrival = new Date("2026-08-11T00:00:00")
    const info = getCalendarDateInfo(checkoutOnlyDate, calendar, nextArrivals)
    const validCheckout = canSelectCheckOut(selectedArrival, checkoutOnlyDate, calendar)

    expect(info.status).toBe("checkout-only")
    expect(canSelectCheckIn(checkoutOnlyDate, calendar, nextArrivals)).toBe(false)
    expect(validCheckout).toBe(true)
    expect(shouldShowCheckoutOnlyCue(info, validCheckout)).toBe(false)
    expect(shouldShowCheckoutOnlyCue(info, false)).toBe(true)
  })

  it("precomputes checkout validity without changing minimum-stay or blocked-night rules", () => {
    const calendar = normalizeHostawayCalendarResult([
      { date: "2027-02-09", isAvailable: 1, minimumStay: 2 },
      { date: "2027-02-10", isAvailable: 1, minimumStay: 2 },
      { date: "2027-02-11", isAvailable: 1, minimumStay: 2 },
      { date: "2027-02-12", isAvailable: 0, reservations: [{ arrivalDate: "2027-02-12", departureDate: "2027-02-14" }] },
      { date: "2027-02-13", isAvailable: 0, reservations: [{ arrivalDate: "2027-02-12", departureDate: "2027-02-14" }] },
    ])
    const validity = buildCheckoutValidityMap(new Date("2027-02-09T00:00:00"), calendar)

    expect(validity["2027-02-10"]).toBe(false)
    expect(validity["2027-02-11"]).toBe(true)
    expect(validity["2027-02-12"]).toBe(true)
    expect(validity["2027-02-13"]).toBe(false)
  })
})
