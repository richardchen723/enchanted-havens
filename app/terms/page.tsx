import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"
import { BRAND_CONTACT_EMAIL } from "@/lib/brand"

export const metadata: Metadata = { title: "Booking Terms", description: "Enchanted Havens reservation, pricing, payment, cancellation, guest responsibility, and property-care terms." }

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Booking Terms"
      introduction="These terms describe the framework for inquiries and direct reservations made with Enchanted Havens. Property-specific terms are presented with each reservation."
      lastUpdated="August 12, 2026"
      contactEmail={BRAND_CONTACT_EMAIL}
      sections={[
        {
          title: "Reservation confirmation",
          body: [
            "An inquiry, availability search, or submitted reservation request does not by itself create a confirmed booking. A reservation is confirmed only after Enchanted Havens verifies availability and pricing and sends written confirmation.",
            "The person making the reservation must be legally able to enter the agreement and is responsible for the reservation, the payment obligations, and the conduct of all guests and visitors.",
          ],
        },
        {
          title: "Pricing and payment",
          body: [
            "The complete stay total may include nightly charges, taxes, cleaning fees, and other disclosed charges. Payment timing, deposits, and any security authorization will be shown in the reservation terms before confirmation.",
            "Payment information is processed securely by Stripe. Enchanted Havens does not store complete card numbers.",
          ],
        },
        {
          title: "Changes and cancellations",
          body: [
            "The cancellation and modification policy supplied with the reservation controls that stay. Date changes, guest-count changes, and property changes are subject to availability, approval, and any resulting price difference.",
          ],
        },
        {
          title: "Guest responsibilities",
          body: [
            "Guests must follow occupancy limits, parking instructions, quiet hours, pet rules, safety guidance, and the house rules provided for the reserved property. Events, vendors, commercial activity, and additional visitors require written approval before arrival.",
          ],
        },
        {
          title: "Property care and damage",
          body: [
            "Guests are responsible for avoidable damage, missing items, excessive cleaning, unauthorized use, and costs caused by a violation of the reservation terms or house rules. Concerns should be reported promptly so our stay team can help during the visit.",
          ],
        },
        {
          title: "Conditions beyond our control",
          body: [
            "Pacific Northwest stays may be affected by weather, ferries, road conditions, utilities, smoke, wildlife, water conditions, and other circumstances outside our control. We will communicate known material issues and provide reasonable assistance, but views, weather, and uninterrupted access to natural amenities cannot be guaranteed.",
          ],
        },
        {
          title: "Contact",
          body: [
            `Questions about a reservation or these terms may be sent to ${BRAND_CONTACT_EMAIL}. The property-specific confirmation and policies remain the controlling terms for an individual stay.`,
          ],
        },
      ]}
    />
  )
}
