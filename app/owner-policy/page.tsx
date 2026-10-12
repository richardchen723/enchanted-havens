import { LegalPage } from "@/components/legal-page"
import { BRAND_CONTACT_EMAIL } from "@/lib/brand"
import { shareMetadata } from "@/lib/seo-metadata"

export const metadata = shareMetadata({
  title: "Property Owner Policy",
  description: "Enchanted Havens property owner policy covering management responsibilities, booking channels, termination, future reservations, and final settlement.",
  path: "/owner-policy",
})

export default function OwnerPolicyPage() {
  return (
    <LegalPage
      eyebrow="For Property Owners"
      title="Property Owner Policy"
      introduction="Our framework for working with property owners, caring for guest commitments, and arranging a clear handover when management ends."
      lastUpdated="October 12, 2026"
      contactEmail={BRAND_CONTACT_EMAIL}
      sections={[
        {
          title: "Your management agreement",
          body: [
            "Enchanted Havens (EH) provides the services specified in your signed property management agreement through the management entity identified in that agreement. This policy applies when incorporated into that agreement or otherwise accepted by both parties in writing. Property-specific terms in a signed agreement, amendment, or settlement take precedence over this general policy, subject to applicable law.",
            "Publication or revision of this policy does not retroactively change an existing contract, create a right to terminate it, or establish an owner's acceptance of new charges. Guest reservations remain subject to their own terms and the rules of the booking platform.",
          ],
        },
        {
          title: "Services and property care",
          body: [
            "The agreed scope may include listing preparation, marketing, pricing, reservation coordination, guest communication, housekeeping coordination, and financial reporting. EH will carry out its agreed duties with reasonable care. Occupancy, revenue, uninterrupted platform access, and guest conduct are not guaranteed.",
            "Owners must provide accurate property information and maintain a safe, properly equipped home, required permits, utilities, and insurance suitable for vacation rental use. Owners must promptly disclose defects, restrictions, ownership changes, or other matters affecting a stay. Maintenance approvals, expense limits, and emergency work follow the signed agreement.",
          ],
        },
        {
          title: "Booking channels and account access",
          body: [
            "An owner-controlled channel is a listing or booking account held and controlled by the owner. An EH-controlled channel is a listing, account, or direct booking system held and controlled by EH. The classification depends on the particular account and its permissions, rather than the name of the booking platform. Listing, review, reservation, and account transfers depend on platform rules and any required consent.",
            "Owners must maintain the access reasonably required for EH to perform its contracted duties while those duties remain in effect. Changes to passwords, permissions, payout details, or calendars must be coordinated with EH, except where immediate action is necessary for security or required by law. Ownership and permitted use of photographs, listing content, branding, and other materials follow the signed agreement and applicable licenses. Guest information is shared only as needed and permitted for management, handover, and legal obligations.",
          ],
        },
        {
          title: "Fees, statements, and owner use",
          body: [
            "Management fees during the engagement, reimbursable expenses, reporting frequency, and payment deadlines are set out in the signed agreement. EH will provide statements showing the relevant receipts, fees, expenses, and owner balance. Owners must provide booking and payout records reasonably needed for reconciliation and pay agreed amounts when due. Deductions from funds held for an owner require contractual authorization and must comply with applicable law.",
            "Owners must coordinate personal stays, maintenance closures, and independently accepted reservations with EH to prevent calendar conflicts and honor confirmed guest commitments. Responsibility for taxes, cleaning, repairs, refunds, and other operating costs follows the signed agreement and applicable platform requirements.",
          ],
        },
        {
          title: "Termination and the booking schedule",
          body: [
            "Notice requirements, grounds for termination, cure periods, and the effective termination date are governed by the signed agreement or a written settlement signed by both parties. A request to end management does not by itself waive outstanding fees, contractual notice requirements, or either party's rights concerning a breach.",
            "Before handover, EH and the owner will agree in writing on a schedule of affected reservations, the date responsibility changes, and the treatment of each booking. The following post-termination provisions concern reservations confirmed during EH's engagement and still outstanding for stays after termination. They do not impose a commission on new bookings first secured independently by the owner after termination.",
          ],
        },
        {
          title: "Owner-controlled bookings: 15% commission",
          body: [
            "For affected reservations on owner-controlled channels that the owner retains after termination, the owner will pay EH a 15% commission on the total booking value, including cleaning fees. This commission compensates EH for its work securing and supporting those reservations during the management engagement.",
            "From the agreed handover date, the owner assumes full responsibility for managing the retained reservations, including guest communications, access, cleaning, property operations, and compliance with reservation and platform obligations. EH's continuing services, if any, must be separately agreed in writing. The booking schedule will state the treatment of taxes, platform fees, refunds, and commissions already paid so the same commission is not charged twice.",
          ],
        },
        {
          title: "EH-controlled bookings: 10% cancellation fee",
          body: [
            "For affected reservations on EH-controlled channels that cannot be transferred to the owner or a replacement manager, EH will cancel the reservations and process applicable guest refunds under the written termination arrangement and applicable platform rules. The owner will pay EH a cancellation fee of 10% of those reservations' total booking value, including cleaning fees, as agreed compensation for disruption and anticipated reputational and account-health impacts.",
            "The cancellation process will follow a termination arrangement signed by both parties and any required platform or guest procedures. The fee is an owner obligation to EH; it does not reduce a guest's refund entitlement. A reservation will not be charged both this 10% cancellation fee and the 15% retained-booking commission. Any permitted transfer of an EH-controlled reservation, and any services or charges associated with that transfer, must be separately agreed in writing.",
          ],
        },
        {
          title: "Final settlement and handover",
          body: [
            "EH will provide an itemized final statement covering outstanding management fees, the agreed reservation schedule, the 15% commissions or 10% cancellation fees where applicable, receipts, transfers, expenses, refunds, and credits for amounts already paid. The parties will confirm the treatment of taxes and platform fees, a deadline for written objections, and the due date for the agreed net balance. Any deductions must be expressly authorized in the signed agreement or settlement.",
            "The written handover plan will address keys, access codes, owner records, guest communications, funds, and permitted listing changes. Duties concerning later refunds, chargebacks, or cancellation costs survive only as provided in the signed agreement or settlement. Neither the handover nor these owner charges remove the rights of guests, payment providers, or booking platforms.",
          ],
        },
        {
          title: "Disputes, releases, and policy changes",
          body: [
            "Owners should raise questions or discrepancies promptly in writing so the parties can attempt a good-faith resolution. Governing law, dispute procedures, and available remedies follow the signed agreement and applicable law. Ending management does not automatically release either party from a claim. Any agreed mutual release takes effect only on the agreed date after the required settlement obligations are completed and cleared funds are received; the right to enforce the settlement remains.",
            `Changes affecting an existing engagement require the agreement or acceptance required by its governing contract. No settlement, amendment, or waiver is created merely by this website policy. Questions about owner services or these provisions may be sent to ${BRAND_CONTACT_EMAIL}.`,
          ],
        },
      ]}
    />
  )
}
