import type { Property, PropertyVariant, Review } from "@/lib/schemas"
import { brandEntityFields } from "@/lib/brand-schema"
import { significantLinks, webpageRefs } from "@/lib/seo-link-graph"
import { directBookingOffer, directBookingOfferCatalog, schemaRefs } from "@/lib/seo-offers"
import { absoluteUrl, formatCount } from "@/lib/utils"

export type CollectionGuide = {
  eyebrow: string
  title: string
  href: string
  text: string
  propertySlugs: string[]
  keywords: string[]
}

export type CollectionLink = {
  label: string
  href: string
  text: string
}

export const HAVENS_COLLECTION_PATH = "/havens"
export const HAVENS_COLLECTION_TITLE = "Pacific Northwest Vacation Rentals | The Havens"
export const HAVENS_COLLECTION_DESCRIPTION =
  "Browse Enchanted Havens' curated Pacific Northwest vacation rentals, including Lake Sutherland cabins, Hood Canal beachfront homes, Whidbey Island estates, and Olympic Peninsula retreats."
const HAVENS_COLLECTION_IMAGE = "/images/home-hero/heros-zip/hero-07.webp"

export const havensCollectionKeywords = [
  "Pacific Northwest vacation rentals",
  "Washington waterfront vacation rentals",
  "Washington beach house rentals",
  "luxury vacation rentals near Seattle",
  "Washington lake house rentals",
  "Lake Sutherland cabin rental",
  "Olympic National Park vacation rentals",
  "Olympic National Park vacation rental",
  "Port Angeles vacation rentals",
  "Hood Canal beachfront rental",
  "Whidbey Island beach house rental",
  "Whidbey Island private estate rental",
  "family reunion house Washington",
  "PNW retreat rental",
]

export const collectionGuides: CollectionGuide[] = [
  {
    eyebrow: "Lake Sutherland",
    title: "Lakefront cabins and Olympic Peninsula lake houses",
    href: "/destinations/lake-sutherland-vacation-rentals",
    text: "Clear water, docks, kayaks, hot tubs, and Port Angeles access for guests searching Lake Sutherland cabin rentals or Olympic National Park vacation rentals.",
    propertySlugs: ["blue-haven", "emerald-haven", "reflection-haven"],
    keywords: ["Washington lake house rental", "Lake Sutherland cabin rental", "Port Angeles vacation rental", "Port Angeles lake house rental", "Olympic National Park basecamp"],
  },
  {
    eyebrow: "Whidbey Island",
    title: "Oceanfront homes and private estate stays near Seattle",
    href: "/destinations/whidbey-island-private-estate-rentals",
    text: "Island stays for horizon views, estate privacy, family reunions, and direct-book escapes within reach of Seattle ferry and road routes.",
    propertySlugs: ["whidbey-estate", "sea-renity-haven"],
    keywords: ["Whidbey Island private estate rental", "luxury vacation rentals near Seattle", "Oak Harbor oceanfront rental"],
  },
  {
    eyebrow: "Hood Canal",
    title: "Beachfront, sauna, and oyster-country retreats",
    href: "/destinations/hood-canal-beachfront-rentals",
    text: "A quieter saltwater setting for guests looking for Hood Canal beachfront rentals, sauna weekends, and restorative waterfront time.",
    propertySlugs: ["fair-haven"],
    keywords: ["Hood Canal beachfront rental", "Belfair vacation rental", "Washington beachfront vacation rental"],
  },
  {
    eyebrow: "Groups and Retreats",
    title: "Family reunion houses and permit-aware private retreats",
    href: "/groups/family-reunion-house-washington",
    text: "Large homes and private estate options for groups that need bedrooms, gathering space, direct planning support, and clear rules before booking.",
    propertySlugs: ["whidbey-estate", "sea-renity-haven", "aurora-haven", "emerald-haven"],
    keywords: ["family reunion house Washington", "PNW retreat rental", "private estate rental Washington"],
  },
]

export const collectionTrustSignals = [
  {
    title: "Curated Inventory",
    text: "A focused collection of rare homes rather than endless commodity listings, each chosen for setting, privacy, and guest experience.",
  },
  {
    title: "Direct-Booking Clarity",
    text: "Dates and guest count reveal exact pricing before guests continue into direct booking or inquiry support.",
  },
  {
    title: "Local Stay Guidance",
    text: "The stay team can compare lake access, ferry logistics, gathering rules, pet fit, and the best home for each group.",
  },
]

export const havensCollectionFaq = [
  {
    question: "Where are Enchanted Havens vacation rentals located?",
    answer:
      "The collection spans Lake Sutherland, Port Angeles and the Olympic Peninsula, Hood Canal, Whidbey Island, Puget Sound, and the Washington Coast.",
  },
  {
    question: "What kinds of Pacific Northwest vacation rentals are in the collection?",
    answer:
      "Enchanted Havens includes lakefront cabins, oceanfront homes, beachfront retreats, forested Olympic Peninsula stays, and a private waterfront estate on Whidbey Island.",
  },
  {
    question: "Can I book directly instead of using an OTA?",
    answer:
      "Yes. Guests can select dates and guest count for live availability and complete pricing, then continue through direct booking or ask the stay team for help choosing the right haven.",
  },
  {
    question: "Which havens are best for family reunions or retreats?",
    answer:
      "The Cove Club, Sea-Renity Haven, Emerald Haven, Aurora Haven, Reflection Haven, and Fair Haven can each support different group styles. The right fit depends on overnight guests, bedrooms, parking, pets, quiet hours, vendors, and any event-style plans.",
  },
  {
    question: "Are events allowed at Enchanted Havens properties?",
    answer:
      "Event-style use, day guests, vendors, amplified music, ceremonies, and tenting must be approved before booking and must follow property rules, quiet hours, parking limits, and local permit requirements.",
  },
]

export const collectionInternalLinks: CollectionLink[] = [
  {
    label: "Pacific Northwest Vacation Rentals",
    href: "/stays/pacific-northwest-vacation-rentals",
    text: "Start with the broad PNW vacation rental guide when the destination is flexible.",
  },
  {
    label: "Washington Waterfront Vacation Rentals",
    href: "/stays/washington-waterfront-vacation-rentals",
    text: "Compare lakefront, oceanfront, beachfront, and private-estate water stays.",
  },
  {
    label: "Washington Lake House Rentals",
    href: "/stays/washington-lake-house-rentals",
    text: "Compare Lake Sutherland lake houses with docks, kayaks, hot tubs, and Port Angeles park access.",
  },
  {
    label: "Washington Beach House Rentals",
    href: "/stays/washington-beach-house-rentals",
    text: "Compare Hood Canal beachfront, Whidbey oceanfront, and private Puget Sound shoreline stays.",
  },
  {
    label: "Washington Hot Tub Vacation Rentals",
    href: "/amenities/washington-hot-tub-vacation-rentals",
    text: "Find lake, forest, and Olympic Peninsula homes where warm water shapes the evening.",
  },
  {
    label: "Private Dock Vacation Rentals",
    href: "/amenities/washington-vacation-rentals-with-private-dock",
    text: "Compare lake homes where a dock, swimming, and paddling can become the trip itself.",
  },
  {
    label: "Pet-Friendly Vacation Rentals",
    href: "/amenities/pet-friendly-vacation-rentals-washington",
    text: "Compare pet-friendly Washington stays by setting, house rules, and direct-book fit.",
  },
  {
    label: "Vacation Rentals with Firepits",
    href: "/amenities/washington-vacation-rentals-with-firepit",
    text: "Find homes where evening firelight, decks, and outdoor gathering space are part of the trip.",
  },
  {
    label: "Olympic National Park Vacation Rentals",
    href: "/destinations/olympic-national-park-vacation-rentals",
    text: "Find private Lake Sutherland and Port Angeles-area homes for park days and restorative returns.",
  },
  {
    label: "Port Angeles Vacation Rentals",
    href: "/destinations/port-angeles-vacation-rentals",
    text: "Compare private Port Angeles-area stays for Lake Sutherland, Lake Crescent, and Olympic National Park trips.",
  },
  {
    label: "Luxury Vacation Rentals Near Seattle",
    href: "/stays/luxury-vacation-rentals-near-seattle",
    text: "Find premium homes that feel resort-like without requiring a flight.",
  },
  {
    label: "Private Estate Rentals in Washington",
    href: "/groups/private-estate-rental-washington",
    text: "Explore full-property privacy, estate gatherings, and permit-aware planning.",
  },
  {
    label: "Olympic National Park Basecamps",
    href: "/experiences/olympic-national-park-basecamp",
    text: "Choose a home that works after long days in the park, forest, and mountains.",
  },
  {
    label: "Wellness, Hot Tub, and Sauna Stays",
    href: "/experiences/wellness-hot-tub-sauna",
    text: "Look for restorative homes with hot tubs, sauna rituals, firelight, and quiet outdoor spaces.",
  },
]

const propertyBestFits: Record<string, string> = {
  "blue-haven": "Lake Sutherland cabin stays, private beach time, kayaking, and Olympic National Park trips.",
  "sea-renity-haven": "Whidbey Island oceanfront gatherings, shared meals, salt air, and larger family stays.",
  "emerald-haven": "Designer lake-house weekends with a private dock, hot tub, firepit, and Mt. Storm King views.",
  "fair-haven": "Hood Canal beachfront resets, barrel sauna sessions, oyster-country evenings, and slower coastal stays.",
  "aurora-haven": "Private Olympic Peninsula group escapes with sea views, games, and room for high-energy families.",
  "reflection-haven": "Lakeside Olympic National Park basecamp stays with hot tub recovery after days outside.",
  "reflection-point": "Lake Sutherland stays with three king bedrooms, a private dock, paddling gear, and firelit waterfront evenings.",
  "whidbey-estate": "The Cove Club private estate stays, family reunions, full-property privacy, and approved gatherings.",
}

function primaryVariant(property: Property): PropertyVariant {
  return property.estate
    ? property.variants.find((variant) => variant.slug === "full-estate") || property.variants[0]
    : property.variants[0]
}

function absoluteImageUrl(src: string) {
  return src.startsWith("/") ? absoluteUrl(src) : src
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

function selectSchemaReviews(reviews: Review[]) {
  return reviews
    .filter((review) => review.rating >= 4.8)
    .filter((review, index, all) => all.findIndex((item) => item.id === review.id || item.text === review.text) === index)
    .slice(0, 5)
}

export function getCollectionPropertySummary(property: Property) {
  const variant = primaryVariant(property)
  return {
    property,
    variant,
    href: `/havens/${property.slug}`,
    bestFit: propertyBestFits[property.slug] || property.narrative,
    capacity: `Up to ${formatCount(variant.guests, "guest")}`,
    rooms: `${formatCount(variant.bedrooms, "bedroom")} · ${formatCount(variant.bathrooms, "bath")}`,
    tags: property.experienceTags.slice(0, 4),
  }
}

export function getHavensCollectionStats(catalog: Property[]) {
  const destinations = new Set(catalog.map((property) => property.eyebrow))
  const maxGuests = Math.max(...catalog.map((property) => primaryVariant(property).guests))
  const waterfrontHomes = catalog.filter((property) => /water|lake|ocean|beach|dock|canal/i.test([...property.experienceTags, property.eyebrow].join(" "))).length

  return [
    { value: formatCount(catalog.length, "haven"), label: "curated private stays" },
    { value: formatCount(destinations.size, "setting"), label: "across water, forest, coast, and estate landscapes" },
    { value: `Up to ${formatCount(maxGuests, "guest")}`, label: "for larger family and friend stays" },
    { value: formatCount(waterfrontHomes, "waterfront haven"), label: "with lake, ocean, beach, canal, or dock-led experiences" },
  ]
}

export function buildHavensCollectionJsonLd(catalog: Property[], reviews: Review[] = []) {
  const pageUrl = absoluteUrl(HAVENS_COLLECTION_PATH)
  const selectedReviews = selectSchemaReviews(reviews)
  const rating = aggregateRating(selectedReviews)
  const summaries = catalog.map(getCollectionPropertySummary)
  const bookingOffers = summaries.map(({ property, href }) => {
    const propertyUrl = absoluteUrl(href)
    return directBookingOffer({
      id: `${propertyUrl}#direct-book-offer`,
      name: `Direct booking for ${property.displayName}`,
      url: propertyUrl,
      reserveTarget: `${propertyUrl}#reserve`,
      itemOfferedId: `${propertyUrl}#lodging`,
      sellerId: `${absoluteUrl()}#lodging-brand`,
    })
  })
  const offerCatalogId = `${pageUrl}#direct-book-offers`
  const propertyPaths = summaries.map(({ href }) => href)
  const guidePaths = [
    ...collectionGuides.map((guide) => guide.href),
    ...collectionInternalLinks.map((link) => link.href),
  ]

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl()}#organization`,
        ...brandEntityFields({ knowsAbout: havensCollectionKeywords, description: HAVENS_COLLECTION_DESCRIPTION }),
        makesOffer: schemaRefs(bookingOffers),
        hasOfferCatalog: { "@id": offerCatalogId },
      },
      {
        "@type": "WebSite",
        "@id": `${absoluteUrl()}#website`,
        name: "Enchanted Havens",
        url: absoluteUrl(),
        publisher: { "@id": `${absoluteUrl()}#organization` },
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/havens")}?checkIn={check_in}&checkOut={check_out}&guests={guests}`,
          "query-input": ["required name=check_in", "required name=check_out", "required name=guests"],
        },
      },
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        name: HAVENS_COLLECTION_TITLE,
        url: pageUrl,
        description: HAVENS_COLLECTION_DESCRIPTION,
        about: havensCollectionKeywords,
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteImageUrl(HAVENS_COLLECTION_IMAGE),
          name: "The Havens Pacific Northwest vacation rental collection",
          caption: "Pacific Northwest private vacation rental collection across water, forest, coast, and estate settings",
          representativeOfPage: true,
        },
        isPartOf: { "@id": `${absoluteUrl()}#website` },
        publisher: { "@id": `${absoluteUrl()}#organization` },
        hasPart: [
          { "@id": `${pageUrl}#collection` },
          { "@id": offerCatalogId },
          { "@id": `${pageUrl}#faq` },
          ...webpageRefs(guidePaths),
        ],
        significantLink: significantLinks([...propertyPaths, ...guidePaths]),
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        mainEntity: { "@id": `${pageUrl}#collection` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() },
          { "@type": "ListItem", position: 2, name: "The Havens", item: pageUrl },
        ],
      },
      {
        "@type": "LodgingBusiness",
        "@id": `${absoluteUrl()}#lodging-brand`,
        ...brandEntityFields({ knowsAbout: havensCollectionKeywords, description: HAVENS_COLLECTION_DESCRIPTION }),
        image: absoluteImageUrl(catalog[0]?.heroImage || "/images/home-hero/heros-zip/hero-07.webp"),
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
          name: "Direct-book Enchanted Havens Pacific Northwest vacation rentals",
          offers: bookingOffers,
        }),
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#collection`,
        name: "Enchanted Havens Pacific Northwest vacation rental collection",
        numberOfItems: summaries.length,
        itemListElement: summaries.map(({ property, variant, href }, index) => {
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
              image: [property.heroImage, ...property.gallery.slice(0, 5)].map(absoluteImageUrl),
              description: property.seoDescription,
              address: {
                "@type": "PostalAddress",
                addressLocality: variant.city || property.location,
                addressRegion: "WA",
                addressCountry: "US",
              },
              amenityFeature: property.experienceTags.slice(0, 8).map((tag) => ({
                "@type": "LocationFeatureSpecification",
                name: tag,
                value: true,
              })),
              maximumAttendeeCapacity: variant.guests || undefined,
              numberOfRooms: variant.bedrooms || undefined,
              offers: { "@id": offer["@id"] },
              potentialAction: { "@type": "ReserveAction", target: absoluteUrl(`${href}#reserve`) },
              ...(variant.rating && variant.reviewsCount
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: variant.rating,
                      reviewCount: variant.reviewsCount,
                    },
                  }
                : {}),
            },
          }
        }),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: havensCollectionFaq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  }
}
