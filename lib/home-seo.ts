import type { Property, PropertyVariant, Review } from "@/lib/schemas"
import { brandEntityFields } from "@/lib/brand-schema"
import { significantLinks, webpageRefs } from "@/lib/seo-link-graph"
import { directBookingOffer, directBookingOfferCatalog, schemaRefs } from "@/lib/seo-offers"
import { absoluteUrl } from "@/lib/utils"

export const HOME_TITLE = "Pacific Northwest Vacation Rentals | Enchanted Havens"
export const HOME_DESCRIPTION =
  "Book curated Pacific Northwest vacation rentals across Lake Sutherland, Olympic Peninsula, Hood Canal, Whidbey Island, Puget Sound, and the Washington Coast."
export const HOME_OG_IMAGE = "/images/home-hero/heros-zip/hero-02.webp"

export const homeKeywords = [
  "Pacific Northwest vacation rentals",
  "Washington waterfront vacation rentals",
  "Washington beach house rentals",
  "Washington cabin rentals",
  "Washington vacation rentals near Seattle",
  "Seattle weekend getaway rental",
  "luxury vacation rentals near Seattle",
  "Washington lake house rentals",
  "Lake Sutherland cabin rental",
  "Lake Crescent vacation rentals",
  "Olympic National Park vacation rentals",
  "Olympic National Park vacation rental",
  "Port Angeles vacation rentals",
  "Port Angeles lake house rental",
  "Hood Canal beachfront rental",
  "Whidbey Island beach house rental",
  "Whidbey Island vacation rentals",
  "Whidbey Island private estate rental",
  "family reunion house Washington",
  "Washington group vacation rental",
  "large group vacation rental Washington",
  "Washington wedding lodging",
  "wedding guest lodging Washington",
  "PNW retreat rental",
  "company retreat rental PNW",
  "direct book vacation rentals Washington",
  "book direct vacation rentals Washington",
]

export const homeFaq = [
  {
    question: "Where are Enchanted Havens vacation rentals located?",
    answer:
      "Enchanted Havens curates private stays across Lake Sutherland, Port Angeles and the Olympic Peninsula, Hood Canal, Whidbey Island, Puget Sound, and the Washington Coast.",
  },
  {
    question: "Can I book directly instead of using an OTA?",
    answer:
      "Yes. Guests can browse the collection, select exact dates for live availability and complete pricing, then book directly or contact the stay team for help choosing the right home.",
  },
  {
    question: "Which homes are best for family reunions or retreats?",
    answer:
      "The Cove Club, Sea-Renity Haven, Emerald Haven, Fair Haven, Aurora Haven, and Reflection Haven can each fit different group styles. The right choice depends on guest count, bedroom needs, parking, pets, quiet hours, and any event-style plans.",
  },
  {
    question: "Are events or private retreats allowed?",
    answer:
      "Event-style use, day guests, vendors, ceremonies, amplified music, tenting, and retreat programming must be approved before booking and must follow property rules and local requirements.",
  },
]

export const homeSeoLinks = [
  {
    label: "Pacific Northwest vacation rentals",
    href: "/stays/pacific-northwest-vacation-rentals",
    text: "Compare the full collection by setting, trip style, and direct-book fit.",
  },
  {
    label: "Direct book vacation rentals",
    href: "/stays/direct-book-vacation-rentals-washington",
    text: "Book Washington vacation rentals directly with exact date-based pricing and stay-team support.",
  },
  {
    label: "Lake Sutherland cabin rentals",
    href: "/destinations/lake-sutherland-vacation-rentals",
    text: "Find Lake Sutherland cabins and lake houses near Port Angeles and Olympic National Park.",
  },
  {
    label: "Washington lake house rentals",
    href: "/stays/washington-lake-house-rentals",
    text: "Compare Lake Sutherland lake houses with docks, kayaks, hot tubs, and Port Angeles park access.",
  },
  {
    label: "Lake Crescent vacation rentals",
    href: "/destinations/lake-crescent-vacation-rentals",
    text: "Use nearby Lake Sutherland and Port Angeles homes as private bases for Lake Crescent and park days.",
  },
  {
    label: "Olympic National Park vacation rentals",
    href: "/destinations/olympic-national-park-vacation-rentals",
    text: "Choose a private Lake Sutherland or Port Angeles-area base for park days and restorative returns.",
  },
  {
    label: "Port Angeles vacation rentals",
    href: "/destinations/port-angeles-vacation-rentals",
    text: "Use Port Angeles as the practical gateway for Lake Sutherland, Lake Crescent, and Olympic National Park stays.",
  },
  {
    label: "Washington cabin rentals",
    href: "/stays/washington-cabin-rentals",
    text: "Compare cabin-style lake, forest, Hood Canal, and Olympic Peninsula stays.",
  },
  {
    label: "Port Angeles lake house rentals",
    href: "/destinations/port-angeles-lake-house-rentals",
    text: "Plan a Port Angeles-area lake stay near Lake Sutherland, Lake Crescent, and Olympic National Park.",
  },
  {
    label: "Whidbey Island private estate rentals",
    href: "/destinations/whidbey-island-private-estate-rentals",
    text: "Explore The Cove Club and Whidbey Island oceanfront stays near Seattle.",
  },
  {
    label: "Whidbey Island vacation rentals",
    href: "/destinations/whidbey-island-vacation-rentals",
    text: "Compare Oak Harbor oceanfront stays and Freeland private estate lodging.",
  },
  {
    label: "Vacation rentals near Seattle",
    href: "/stays/washington-vacation-rentals-near-seattle",
    text: "Compare Whidbey Island, Hood Canal, and waterfront weekend getaways near Seattle.",
  },
  {
    label: "Washington beach house rentals",
    href: "/stays/washington-beach-house-rentals",
    text: "Compare Hood Canal beachfront, Whidbey oceanfront, and private Puget Sound shoreline stays.",
  },
  {
    label: "Washington Coast vacation rentals",
    href: "/destinations/washington-coast-vacation-rentals",
    text: "Find salt-air stays with horizon views, island coastlines, Hood Canal shoreline, and private gathering time.",
  },
  {
    label: "Hood Canal beachfront rentals",
    href: "/destinations/hood-canal-beachfront-rentals",
    text: "Plan a Hood Canal stay with beach, sauna, oyster-country atmosphere, and direct support.",
  },
  {
    label: "Washington hot tub rentals",
    href: "/amenities/washington-hot-tub-vacation-rentals",
    text: "Choose homes where warm water, forest air, and lake or park days shape the evening.",
  },
  {
    label: "Pet-friendly vacation rentals",
    href: "/amenities/pet-friendly-vacation-rentals-washington",
    text: "Compare Washington stays where pets may fit the trip, rules, setting, and guest count.",
  },
  {
    label: "Vacation rentals with firepits",
    href: "/amenities/washington-vacation-rentals-with-firepit",
    text: "Find Washington homes where outdoor evenings, firelight, and gathering space shape the stay.",
  },
  {
    label: "Family reunion houses",
    href: "/groups/family-reunion-house-washington",
    text: "Compare larger homes, estate options, and permit-aware gathering guidance.",
  },
  {
    label: "Group vacation rentals",
    href: "/groups/washington-group-vacation-rentals",
    text: "Compare large-group homes, estate stays, waterfront houses, and direct planning support.",
  },
  {
    label: "Wedding lodging",
    href: "/groups/washington-wedding-lodging",
    text: "Plan permit-aware wedding-weekend lodging with private homes, estate stays, and clear approval steps.",
  },
  {
    label: "Company retreat rentals",
    href: "/groups/company-retreat-rental-pnw",
    text: "Find private homes for focused team stays with clear fit, vendor, and rule guidance.",
  },
]

function absoluteImageUrl(src: string) {
  return src.startsWith("/") ? absoluteUrl(src) : src
}

function primaryVariant(property: Property): PropertyVariant {
  return property.estate
    ? property.variants.find((variant) => variant.slug === "full-estate") || property.variants[0]
    : property.variants[0]
}

function aggregateRating(reviews: Review[]) {
  const rated = reviews.filter((review) => review.rating > 0)
  if (!rated.length) return undefined
  const ratingValue = Math.round((rated.reduce((sum, review) => sum + review.rating, 0) / rated.length) * 100) / 100
  return {
    "@type": "AggregateRating",
    ratingValue,
    reviewCount: rated.length,
    bestRating: 5,
  }
}

export function buildHomeJsonLd({ catalog, reviews }: { catalog: Property[]; reviews: Review[] }) {
  const homeUrl = absoluteUrl()
  const selectedReviews = reviews.filter((review) => review.rating >= 4.8).slice(0, 6)
  const rating = aggregateRating(selectedReviews)
  const bookingOffers = catalog.map((property) => {
    const href = `/havens/${property.slug}`
    const propertyUrl = absoluteUrl(href)
    return directBookingOffer({
      id: `${propertyUrl}#direct-book-offer`,
      name: `Direct booking for ${property.displayName}`,
      url: propertyUrl,
      reserveTarget: `${propertyUrl}#reserve`,
      itemOfferedId: `${propertyUrl}#lodging`,
      sellerId: `${homeUrl}#lodging-brand`,
    })
  })
  const offerCatalogId = `${homeUrl}#direct-book-offers`
  const homeChildPaths = [
    "/havens",
    "/destinations",
    "/stays",
    "/groups",
    "/experiences",
    "/amenities",
    ...homeSeoLinks.map((link) => link.href),
  ]

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${homeUrl}#organization`,
        ...brandEntityFields({ knowsAbout: homeKeywords, description: HOME_DESCRIPTION }),
      },
      {
        "@type": "WebSite",
        "@id": `${homeUrl}#website`,
        name: "Enchanted Havens",
        url: homeUrl,
        publisher: { "@id": `${homeUrl}#organization` },
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/havens")}?checkIn={check_in}&checkOut={check_out}&guests={guests}`,
          "query-input": ["required name=check_in", "required name=check_out", "required name=guests"],
        },
      },
      {
        "@type": "WebPage",
        "@id": `${homeUrl}#webpage`,
        name: HOME_TITLE,
        url: homeUrl,
        description: HOME_DESCRIPTION,
        isPartOf: { "@id": `${homeUrl}#website` },
        about: homeKeywords,
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteImageUrl(HOME_OG_IMAGE),
          name: "Pacific Northwest vacation rentals with Enchanted Havens",
          caption: "Pacific Northwest private vacation rental views with Enchanted Havens",
          representativeOfPage: true,
        },
        hasPart: webpageRefs(homeChildPaths),
        significantLink: significantLinks(homeChildPaths),
        mainEntity: { "@id": `${homeUrl}#collection` },
        breadcrumb: { "@id": `${homeUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${homeUrl}#breadcrumb`,
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: homeUrl }],
      },
      {
        "@type": "LodgingBusiness",
        "@id": `${homeUrl}#lodging-brand`,
        ...brandEntityFields({ description: HOME_DESCRIPTION }),
        image: absoluteImageUrl(HOME_OG_IMAGE),
        potentialAction: { "@type": "ReserveAction", target: absoluteUrl("/havens#availability") },
        makesOffer: schemaRefs(bookingOffers),
        hasOfferCatalog: { "@id": offerCatalogId },
        ...(rating ? { aggregateRating: rating } : {}),
        ...(selectedReviews.length
          ? {
              review: selectedReviews.map((review) => ({
                "@type": "Review",
                author: { "@type": "Person", name: review.guestName },
                reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
                reviewBody: review.text,
                datePublished: review.date,
                itemReviewed: review.propertyName,
              })),
            }
          : {}),
      },
      {
        ...directBookingOfferCatalog({
          id: offerCatalogId,
          name: "Direct-book Enchanted Havens vacation rental offers",
          offers: bookingOffers,
        }),
      },
      {
        "@type": "ItemList",
        "@id": `${homeUrl}#collection`,
        name: "Enchanted Havens Pacific Northwest vacation rentals",
        numberOfItems: catalog.length,
        itemListElement: catalog.map((property, index) => {
          const variant = primaryVariant(property)
          const href = `/havens/${property.slug}`
          const offer = bookingOffers[index]
          return {
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(href),
            item: {
              "@type": "LodgingBusiness",
              "@id": `${absoluteUrl(href)}#lodging`,
              name: property.displayName,
              url: absoluteUrl(href),
              image: absoluteImageUrl(property.heroImage),
              description: property.seoDescription,
              address: {
                "@type": "PostalAddress",
                addressLocality: variant.city || property.location,
                addressRegion: "WA",
                addressCountry: "US",
              },
              maximumAttendeeCapacity: variant.guests || undefined,
              numberOfRooms: variant.bedrooms || undefined,
              offers: { "@id": offer["@id"] },
              potentialAction: { "@type": "ReserveAction", target: absoluteUrl(`${href}#reserve`) },
            },
          }
        }),
      },
      {
        "@type": "FAQPage",
        "@id": `${homeUrl}#faq`,
        mainEntity: homeFaq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  }
}
