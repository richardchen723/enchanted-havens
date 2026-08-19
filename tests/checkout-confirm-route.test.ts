import { beforeEach, describe, expect, it, vi } from "vitest"

const sessionId = "8a974a65-c5d7-47e6-9846-076ef4f04234"
const setupIntentId = "seti_123"
const storedQuote = {
  listingId: 178403,
  checkIn: "2026-09-10",
  checkOut: "2026-09-13",
  guests: 4,
  nights: 3,
  total: 2100,
  currency: "USD",
  available: true,
  components: [{ type: "price", name: "baseRate", title: "Base rate", value: 2100, total: 2100 }],
}
const baseSession = {
  id: sessionId,
  status: "pending",
  property_slug: "emerald-haven",
  variant_slug: "emerald-haven",
  listing_id: 178403,
  check_in: "2026-09-10",
  check_out: "2026-09-13",
  guests: 4,
  guest: { firstName: "Avery", lastName: "Guest", email: "avery@example.com", phone: "2065550100", country: "US" },
  quote: storedQuote,
  stripe_customer_id: "cus_123",
  stripe_setup_intent_id: setupIntentId,
  stripe_payment_method_id: null,
  hostaway_reservation_id: null,
  consent_at: null,
  terms_version: null,
  error: null,
  expires_at: "2099-01-01T00:00:00.000Z",
  confirmed_at: null,
  updated_at: "2026-01-01T00:00:00.000Z",
}

const mocks = vi.hoisted(() => ({
  beginConfirmation: vi.fn(),
  getBookingSession: vi.fn(),
  markBookingConfirmed: vi.fn(),
  markBookingError: vi.fn(),
  createHostawayReservation: vi.fn(),
  findHostawayReservationByReference: vi.fn(),
  getHostawayQuote: vi.fn(),
  getListingMapId: vi.fn(),
  isListingAvailable: vi.fn(),
  retrieveSetupIntent: vi.fn(),
  createPaymentIntent: vi.fn(),
  getProperty: vi.fn(),
  sendBookingConfirmation: vi.fn(),
}))

vi.mock("@/lib/booking-sessions", () => ({
  beginConfirmation: mocks.beginConfirmation,
  getBookingSession: mocks.getBookingSession,
  markBookingConfirmed: mocks.markBookingConfirmed,
  markBookingError: mocks.markBookingError,
}))

vi.mock("@/lib/hostaway", () => ({
  createHostawayReservation: mocks.createHostawayReservation,
  findHostawayReservationByReference: mocks.findHostawayReservationByReference,
  getHostawayQuote: mocks.getHostawayQuote,
  getListingMapId: mocks.getListingMapId,
  isListingAvailable: mocks.isListingAvailable,
}))

vi.mock("@/lib/stripe", () => ({
  stripe: () => ({
    setupIntents: { retrieve: mocks.retrieveSetupIntent },
    paymentIntents: { create: mocks.createPaymentIntent },
  }),
}))

vi.mock("@/lib/catalog", () => ({ getProperty: mocks.getProperty }))
vi.mock("@/lib/email", () => ({ sendBookingConfirmation: mocks.sendBookingConfirmation }))
vi.mock("@/lib/sandbox-booking", () => ({
  confirmSandboxBookingSession: vi.fn(),
  getSandboxBookingSession: vi.fn(),
  isSandboxBooking: () => false,
}))

import { POST } from "@/app/api/checkout/confirm/route"

function request() {
  return new Request("http://localhost/api/checkout/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, setupIntentId, consent: true }),
  })
}

describe("checkout confirmation API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getBookingSession.mockResolvedValue({ ...baseSession })
    mocks.retrieveSetupIntent.mockResolvedValue({ status: "succeeded", payment_method: "pm_123", customer: "cus_123" })
    mocks.getProperty.mockResolvedValue({
      slug: "emerald-haven",
      displayName: "Emerald Haven",
      variants: [{ id: 178403, name: "Emerald Haven" }],
    })
    mocks.isListingAvailable.mockResolvedValue(true)
    mocks.getHostawayQuote.mockResolvedValue(storedQuote)
    mocks.getListingMapId.mockResolvedValue(444)
    mocks.beginConfirmation.mockResolvedValue({ ...baseSession, status: "processing" })
    mocks.markBookingConfirmed.mockResolvedValue(true)
    mocks.markBookingError.mockResolvedValue(undefined)
    mocks.sendBookingConfirmation.mockResolvedValue(undefined)
  })

  it("reconciles an existing Hostaway reservation without creating a duplicate", async () => {
    mocks.getBookingSession.mockResolvedValue({ ...baseSession, status: "reconciliation_required" })
    mocks.findHostawayReservationByReference.mockResolvedValue({ id: 987654, status: "new" })

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, confirmationUrl: `/confirmation/${sessionId}` })
    expect(mocks.findHostawayReservationByReference).toHaveBeenCalledWith(expect.objectContaining({ bookingReference: sessionId }))
    expect(mocks.markBookingConfirmed).toHaveBeenCalledWith({ id: sessionId, paymentMethodId: "pm_123", reservationId: 987654 })
    expect(mocks.createHostawayReservation).not.toHaveBeenCalled()
    expect(mocks.isListingAvailable).not.toHaveBeenCalled()
  })

  it("returns an already-confirmed session without repeating external writes", async () => {
    mocks.getBookingSession.mockResolvedValue({ ...baseSession, status: "confirmed", hostaway_reservation_id: 987654 })

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(mocks.retrieveSetupIntent).not.toHaveBeenCalled()
    expect(mocks.createHostawayReservation).not.toHaveBeenCalled()
    expect(mocks.markBookingConfirmed).not.toHaveBeenCalled()
  })

  it("requires guest reconfirmation when Hostaway pricing changes", async () => {
    mocks.getHostawayQuote.mockResolvedValue({ ...storedQuote, total: 2200 })

    const response = await POST(request())
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.quote.total).toBe(2200)
    expect(mocks.markBookingError).toHaveBeenCalledWith(sessionId, "pending", "Hostaway quote changed before confirmation")
    expect(mocks.beginConfirmation).not.toHaveBeenCalled()
    expect(mocks.createHostawayReservation).not.toHaveBeenCalled()
  })

  it("keeps a failed availability recheck retryable and records the error", async () => {
    mocks.isListingAvailable.mockRejectedValue(new Error("Hostaway request failed (403): Invalid start date"))

    const response = await POST(request())
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload.error).toContain("no reservation was created")
    expect(mocks.markBookingError).toHaveBeenCalledWith(sessionId, "pending", "Hostaway request failed (403): Invalid start date")
    expect(mocks.beginConfirmation).not.toHaveBeenCalled()
    expect(mocks.createHostawayReservation).not.toHaveBeenCalled()
  })

  it("marks an uncertain Hostaway write for reconciliation", async () => {
    mocks.createHostawayReservation.mockRejectedValue(new Error("Hostaway connection closed before a response"))

    const response = await POST(request())

    expect(response.status).toBe(502)
    expect(mocks.markBookingError).toHaveBeenCalledWith(sessionId, "reconciliation_required", "Hostaway connection closed before a response")
    expect(mocks.markBookingConfirmed).not.toHaveBeenCalled()
  })

  it("saves the Stripe customer on Hostaway without creating a charge", async () => {
    mocks.createHostawayReservation.mockResolvedValue({ id: 987654 })

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(mocks.createPaymentIntent).not.toHaveBeenCalled()
    expect(mocks.createHostawayReservation).toHaveBeenCalledWith(expect.objectContaining({
      stripeCustomerId: "cus_123",
    }))
    expect(mocks.createHostawayReservation).toHaveBeenCalledWith(expect.not.objectContaining({
      stripePaymentIntentId: expect.anything(),
      paymentCollected: expect.anything(),
    }))
    expect(mocks.sendBookingConfirmation).toHaveBeenCalledWith(expect.objectContaining({ confirmationReference: sessionId }))
  })
})
