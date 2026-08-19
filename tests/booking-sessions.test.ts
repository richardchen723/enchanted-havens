import { describe, expect, it } from "vitest"
import { normalizeBookingSessionRow } from "@/lib/booking-sessions"

describe("booking session normalization", () => {
  it("converts PostgreSQL date values into Hostaway-compatible date strings", () => {
    const row = normalizeBookingSessionRow({
      id: "8a974a65-c5d7-47e6-9846-076ef4f04234",
      status: "pending",
      property_slug: "sea-renity-haven",
      variant_slug: "sea-renity-haven",
      listing_id: 157299,
      check_in: new Date("2026-08-09T00:00:00.000Z"),
      check_out: new Date("2026-08-10T00:00:00.000Z"),
      guests: 2,
      guest: { firstName: "Test", lastName: "Guest", email: "guest@example.com", phone: "2065550100", country: "US" },
      quote: { listingId: 157299, checkIn: "2026-08-09", checkOut: "2026-08-10", guests: 2, nights: 1, total: 500, currency: "USD", available: true, components: [] },
      stripe_customer_id: "cus_test",
      stripe_setup_intent_id: "seti_test",
      stripe_payment_method_id: null,
      hostaway_reservation_id: null,
      consent_at: null,
      terms_version: null,
      error: null,
      expires_at: new Date("2026-08-09T01:00:00.000Z"),
      confirmed_at: null,
      updated_at: new Date("2026-08-09T00:00:00.000Z"),
    })

    expect(row.check_in).toBe("2026-08-09")
    expect(row.check_out).toBe("2026-08-10")
    expect(row.expires_at).toBe("2026-08-09T01:00:00.000Z")
  })
})
