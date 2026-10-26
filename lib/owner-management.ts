import { BRAND_NAME } from "@/lib/brand"
import { brandEntityFields } from "@/lib/brand-schema"
import { absoluteUrl } from "@/lib/utils"

export const OWNER_PAGE_PATH = "/vacation-rental-management"
export const OWNER_PAGE_TITLE = "PNW Vacation Rental Management"
export const OWNER_PAGE_DESCRIPTION = "Full-service vacation rental management on the Olympic Peninsula, Hood Canal, and Whidbey Island. Explore Enchanted Havens results, marketing, and home care."
export const OWNER_HERO_IMAGE = "/images/sea-renity/sea-renity-firepit-exterior.webp"
export const OWNER_EVIDENCE_DATE = "2026-10-25"
export const OWNER_EVIDENCE_DATE_LABEL = "October 25, 2026"
export const OWNER_PAGE_UPDATED_DATE = "2026-10-26"

export const ownerResults = [
  { name: "Emerald Haven", slug: "emerald-haven", market: "Port Angeles", rank: 1, listings: 774, estimatedRevenue: 264900, source: "https://app.airdna.co/data/us/airdna-50/airdna-3132/top-listings" },
  { name: "Reflection Haven", slug: "reflection-haven", market: "Port Angeles", rank: 3, listings: 774, estimatedRevenue: 235800, source: "https://app.airdna.co/data/us/airdna-50/airdna-3132/top-listings" },
  { name: "Blue Haven", slug: "blue-haven", market: "Port Angeles", rank: 5, listings: 774, estimatedRevenue: 203400, source: "https://app.airdna.co/data/us/airdna-50/airdna-3132/top-listings" },
  { name: "Aurora Haven", slug: "aurora-haven", market: "Port Angeles", rank: 15, listings: 774, source: "https://app.airdna.co/data/us/airdna-50/airdna-3132/top-listings" },
  { name: "Sea-Renity Haven", slug: "sea-renity-haven", market: "Oak Harbor", rank: 5, listings: 207, estimatedRevenue: 124000, source: "https://app.airdna.co/data/us/airdna-50/airdna-2922/top-listings" },
  { name: "Fair Haven", slug: "fair-haven", market: "Belfair", rank: 3, listings: 74, estimatedRevenue: 108500, source: "https://app.airdna.co/data/us/airdna-194/airdna-5948/top-listings" },
] as const

export const ownerReels = [
  { code: "DXsNWoUCNO6", views: "405K" },
  { code: "Da6Qkd6I9Q3", views: "400K" },
  { code: "DYh7lDyIt-5", views: "330K" },
  { code: "DZYSphUofEg", views: "264K" },
] as const

export const ownerServices = [
  { title: "Positioning & presentation", text: "Photography, listing stories, and the details that distinguish your home. We help guests understand what makes the stay worth choosing." },
  { title: "Pricing & calendar", text: "Rates, seasonality, booking patterns, and available dates considered together, with decisions shaped around your property and goals." },
  { title: "Marketing & distribution", text: "A place in the EH collection, supported by our direct-booking website, social presence, and the booking channels agreed for your home." },
  { title: "Guest communication", text: "Support through the guest journey, from questions before booking to arrival, the stay, and departure." },
  { title: "Turnovers & home care", text: "Coordination of cleaning, readiness checks, and maintenance needs to prepare the home for its next stay." },
  { title: "Owner communication", text: "An agreed approach to performance reporting, expenses, maintenance decisions, and personal stays, so you know what to expect." },
] as const

export const ownerRegions = [
  { name: "Olympic Peninsula", location: "Port Angeles · Lake Sutherland · Lake Dawn", image: "/images/home-hero/pnw-blue-haven-night-cabin.webp", alt: "Blue Haven beside Lake Sutherland at dusk on the Olympic Peninsula", text: "Lakefront and forest homes with access to Olympic National Park. Our collection includes Blue, Emerald, Reflection, and Aurora Havens.", homes: [{ name: "Blue Haven", slug: "blue-haven" }, { name: "Emerald Haven", slug: "emerald-haven" }, { name: "Reflection Haven", slug: "reflection-haven" }, { name: "Aurora Haven", slug: "aurora-haven" }] },
  { name: "Hood Canal", location: "Belfair", image: "/images/home-hero/pnw-fair-haven-firepit-water.webp", alt: "Fair Haven's firepit overlooking the Hood Canal waterfront in Belfair", text: "Waterfront hospitality shaped by the shoreline, outdoor living, and time together. Fair Haven anchors our experience in Belfair.", homes: [{ name: "Fair Haven", slug: "fair-haven" }] },
  { name: "Whidbey Island", location: "Oak Harbor", image: "/images/sea-renity/sea-renity-ocean-hero.webp", alt: "Sea-Renity Haven overlooking the water in Oak Harbor on Whidbey Island", text: "Island stays with open water views and room to slow down. Sea-Renity Haven brings the collection to Oak Harbor.", homes: [{ name: "Sea-Renity Haven", slug: "sea-renity-haven" }] },
] as const

export const ownerFaqs = [
  { question: "What does full-service vacation rental management include?", answer: "Enchanted Havens brings together property presentation, pricing and calendar management, marketing, guest communication, turnover coordination, and owner communication. Your management proposal defines the responsibilities for your home and any separately charged services." },
  { question: "Where does Enchanted Havens manage vacation rentals?", answer: "Our current collection includes homes around Port Angeles, Lake Sutherland, and Lake Dawn on the Olympic Peninsula; Belfair on Hood Canal; and Oak Harbor on Whidbey Island, Washington. Share your property's location so we can confirm service availability in your area." },
  { question: "How much could my vacation rental earn?", answer: "Revenue depends on the home, location, amenities, available dates, and seasonal demand. We discuss relevant comparisons and the assumptions behind an assessment. AirDNA estimates and results from other EH homes provide context, not a guarantee of your property's revenue or owner proceeds." },
  { question: "What are your management fees?", answer: "We discuss fees alongside the service scope and your property's needs. Your proposal sets out what is included and which expenses are separate before you decide to proceed." },
  { question: "Can I stay in my own home?", answer: "Tell us how you would like to use your home. We will explain how personal stays, booking availability, and any related costs are handled under the management agreement." },
  { question: "Can I switch from another property manager?", answer: "We can discuss a transition plan covering existing reservations, listing arrangements, property access, and responsibilities under your current agreement. Timing depends on those details." },
  { question: "How will I stay informed about my property?", answer: "Before management begins, we agree on communication, performance reporting, expense visibility, and how maintenance decisions are handled. Those arrangements form part of the plan for your property." },
  { question: "Does my home need to be rental-ready?", answer: "You can contact us while you are still planning. We can discuss the home's condition, presentation, and the steps involved in preparing it for guests. The scope of any setup work is agreed separately." },
] as const

export function ownerManagementSchema() {
  const url = absoluteUrl(OWNER_PAGE_PATH)
  const organizationId = `${absoluteUrl()}#organization`
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": organizationId, ...brandEntityFields() },
      { "@type": "WebPage", "@id": `${url}#webpage`, url, name: `${OWNER_PAGE_TITLE} | ${BRAND_NAME}`, description: OWNER_PAGE_DESCRIPTION, inLanguage: "en-US", dateModified: OWNER_PAGE_UPDATED_DATE, isPartOf: { "@id": `${absoluteUrl()}#website` }, mainEntity: { "@id": `${url}#service` }, breadcrumb: { "@id": `${url}#breadcrumbs` }, hasPart: { "@id": `${url}#owner-questions` }, publisher: { "@id": organizationId }, primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(OWNER_HERO_IMAGE) }, citation: [...new Set(ownerResults.map((result) => result.source))] },
      { "@type": "Service", "@id": `${url}#service`, name: "Full-service vacation rental management", serviceType: "Short-term vacation rental property management", description: OWNER_PAGE_DESCRIPTION, url, provider: { "@id": organizationId }, areaServed: ["Port Angeles", "Belfair", "Oak Harbor"].map((name) => ({ "@type": "Place", name: `${name}, Washington` })), hasOfferCatalog: { "@type": "OfferCatalog", name: "Vacation rental management services", itemListElement: ownerServices.map((service) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: service.title, description: service.text } })) } },
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`, itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() }, { "@type": "ListItem", position: 2, name: "Vacation rental management", item: url }] },
      // The same answers are visible in the HTML. This does not promise FAQ rich results.
      { "@type": "FAQPage", "@id": `${url}#owner-questions`, mainEntity: ownerFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    ],
  }
}
