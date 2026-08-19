import type { Metadata } from "next"
import { LegalPage } from "@/components/legal-page"
import { BRAND_CONTACT_EMAIL } from "@/lib/brand"

export const metadata: Metadata = { title: "Privacy Policy", description: "How Enchanted Havens collects, uses, safeguards, and shares website, inquiry, reservation, payment, map, and analytics information." }

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      introduction="This policy explains what information Enchanted Havens receives, why we use it, and the choices available to guests and site visitors."
      lastUpdated="August 7, 2026"
      contactEmail={BRAND_CONTACT_EMAIL}
      sections={[
        {
          title: "Information we receive",
          body: [
            "We receive information you provide when you inquire about or reserve a stay, including your name, contact details, trip preferences, guest count, dates, messages, and reservation information.",
            "We may also receive technical information such as browser type, device information, referring pages, and basic site activity used to operate, secure, and improve the website.",
          ],
        },
        {
          title: "How we use information",
          body: [
            "We use guest information to respond to inquiries, provide availability and pricing, create and support reservations, communicate arrival details, improve our services, prevent misuse, and meet legal or accounting obligations.",
            "We do not sell personal information. We do not use inquiry details for unrelated third-party advertising.",
          ],
        },
        {
          title: "Payments and reservations",
          body: [
            "Payment details are collected and secured by Stripe. Enchanted Havens does not receive or store complete card numbers. Reservation and stay information may be processed through Hostaway to provide availability, pricing, confirmation, and guest support.",
          ],
        },
        {
          title: "Service providers",
          body: [
            "We share information only as needed with providers that help operate the guest experience, including reservation, payment, email, website hosting, and property operations services. Those providers process information for the services they deliver to us.",
          ],
        },
        {
          title: "Website analytics",
          body: [
            "We use Microsoft Clarity and Vercel Analytics to understand how visitors navigate and use the website. These services may process technical information and interaction data such as page visits, clicks, scrolling, device details, and referring pages so we can improve site usability and performance.",
            "Clarity session recordings are configured to mask sensitive content. We do not intentionally send complete payment card information through website analytics.",
          ],
        },
        {
          title: "Maps and embedded content",
          body: [
            "Property pages may embed Google Maps to show an approximate location. When the map loads, Google may receive technical information such as your IP address, device or browser details, and the page you visited under Google's own privacy terms.",
            "You can use the accompanying Open in Google Maps link instead of interacting with the embedded map. Exact property addresses are provided only through the reservation and arrival process.",
          ],
        },
        {
          title: "Retention and security",
          body: [
            "We retain information for as long as reasonably necessary to support the stay, maintain business and tax records, resolve disputes, protect the service, and meet legal obligations. We use administrative and technical safeguards appropriate to the information we handle, although no online service can guarantee absolute security.",
          ],
        },
        {
          title: "Your choices",
          body: [
            `You may contact us at ${BRAND_CONTACT_EMAIL} to ask about personal information associated with you or to request a correction or deletion. We may need to verify your identity, and some records may be retained where required for legitimate business or legal purposes.`,
          ],
        },
        {
          title: "Updates",
          body: [
            "We may update this policy as our services or legal obligations change. The date shown on this page identifies the latest version.",
          ],
        },
      ]}
    />
  )
}
