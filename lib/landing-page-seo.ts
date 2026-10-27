import { buildVacationRentalEntity } from "@/lib/vacation-rental-schema"
import type { Property, PropertyVariant, Review } from "@/lib/schemas"
import type { SeoHub, SeoLandingPage } from "@/lib/seo-pages"
import { brandEntityFields } from "@/lib/brand-schema"
import { getHubMatchedProperties } from "@/lib/hub-matched-properties"
import { significantLinks, webpageRefs } from "@/lib/seo-link-graph"
import { directBookingOffer, directBookingOfferCatalog, schemaRefs } from "@/lib/seo-offers"
import { absoluteUrl } from "@/lib/utils"

const LOGO_PATH = "/images/enchanted-havens-logo-small.webp"
const CORE_AREA_NAMES = [
  "Pacific Northwest",
  "Washington",
  "Lake Sutherland",
  "Olympic Peninsula",
  "Hood Canal",
  "Whidbey Island",
  "Puget Sound",
  "Washington Coast",
  "Port Angeles",
  "Lake Crescent",
]

function absoluteImageUrl(src: string) {
  return src.startsWith("/") ? absoluteUrl(src) : src
}

function pageImageObject({ url, name, caption }: { url: string; name: string; caption: string }) {
  return {
    "@type": "ImageObject",
    url,
    name,
    caption,
    representativeOfPage: true,
  }
}

function pageLabel(group: string) {
  if (group === "destinations") return "Destinations"
  if (group === "groups") return "Group Stays"
  if (group === "stays") return "Stay Types"
  if (group === "amenities") return "Amenities"
  return "Experiences"
}

function groupPath(group: string) {
  if (group === "experiences") return "/experiences"
  return `/${group}`
}

function primaryVariant(property: Property): PropertyVariant {
  return property.estate
    ? property.variants.find((variant) => variant.slug === "full-estate") || property.variants[0]
    : property.variants[0]
}

function uniqueStrings(items: Array<string | undefined | null>) {
  return items
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .filter((item, index, all) => all.indexOf(item) === index)
}

function pageAreaNames(page: SeoLandingPage, properties: Property[]) {
  return uniqueStrings([
    page.eyebrow,
    ...properties.map((property) => property.location),
    ...properties.map((property) => property.eyebrow),
    ...properties.flatMap((property) => property.variants.map((variant) => variant.city)),
    ...properties.flatMap((property) => property.variants.map((variant) => variant.location)),
  ]).slice(0, 10)
}

function placeCoverage(areaNames: string[]) {
  return areaNames.map((name) => ({
    "@type": "Place",
    name,
    address: name === "Pacific Northwest" || name.includes("Washington") ? undefined : { "@type": "PostalAddress", addressRegion: "WA", addressCountry: "US" },
  }))
}

function hubAreaNames(hub: SeoHub, pages: SeoLandingPage[], matchedProperties: ReturnType<typeof getHubMatchedProperties>) {
  return uniqueStrings([
    ...CORE_AREA_NAMES,
    hub.eyebrow,
    ...pages.map((page) => page.eyebrow),
    ...pages.flatMap((page) => page.keywords),
    ...matchedProperties.map(({ property }) => property.location),
    ...matchedProperties.map(({ property }) => property.eyebrow),
    ...matchedProperties.flatMap(({ property }) => property.variants.map((variant) => variant.city)),
    ...matchedProperties.flatMap(({ property }) => property.variants.map((variant) => variant.location)),
  ]).filter((name) => !/rental|rentals|stays|retreat|retreats|lodging|vacation|direct book|company|wedding|family|group|hot tub|sauna|dock|kayak|pet-friendly|firepit/i.test(name)).slice(0, 16)
}

export function buildLandingPageJsonLd({ page, properties }: { page: SeoLandingPage; properties: Property[]; reviews: Review[] }) {
  const pageUrl = absoluteUrl(page.path)
  const allKeywords = [page.primaryKeyword, ...page.keywords]
  const primaryImage = properties[0]?.heroImage ? absoluteImageUrl(properties[0].heroImage) : absoluteImageUrl(LOGO_PATH)
  const areaNames = pageAreaNames(page, properties)
  const bookingOffers = properties.map((property) => {
    const href = `/havens/${property.slug}`
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
  const propertyPaths = properties.map((property) => `/havens/${property.slug}`)
  const significantPaths = [...propertyPaths, ...page.relatedPaths, groupPath(page.group), "/havens"]
  const spatialCoverage = placeCoverage(areaNames)

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl()}#organization`,
        ...brandEntityFields({ knowsAbout: allKeywords, areaServed: uniqueStrings(["Lake Sutherland", "Olympic Peninsula", "Hood Canal", "Whidbey Island", "Puget Sound", "Washington Coast", ...areaNames]) }),
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
        name: page.h1,
        url: pageUrl,
        description: page.metaDescription,
        about: allKeywords,
        primaryImageOfPage: pageImageObject({
          url: primaryImage,
          name: `${page.h1} primary image`,
          caption: page.imageAlt,
        }),
        spatialCoverage,
        isPartOf: { "@id": `${absoluteUrl()}#website` },
        publisher: { "@id": `${absoluteUrl()}#organization` },
        hasPart: [
          { "@id": `${pageUrl}#collection` },
          { "@id": offerCatalogId },
          { "@id": `${pageUrl}#faq` },
          ...webpageRefs(page.relatedPaths),
        ],
        significantLink: significantLinks(significantPaths),
        mainEntity: { "@id": `${pageUrl}#collection` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() },
          { "@type": "ListItem", position: 2, name: pageLabel(page.group), item: absoluteUrl(groupPath(page.group)) },
          { "@type": "ListItem", position: 3, name: page.title, item: pageUrl },
        ],
      },
      {
        "@type": "LodgingBusiness",
        "@id": `${absoluteUrl()}#lodging-brand`,
        ...brandEntityFields({ areaServed: uniqueStrings(["Lake Sutherland", "Olympic Peninsula", "Hood Canal", "Whidbey Island", "Puget Sound", "Washington Coast", ...areaNames]) }),
        image: primaryImage,
        potentialAction: { "@type": "ReserveAction", target: absoluteUrl("/havens#availability") },
        makesOffer: schemaRefs(bookingOffers),
        hasOfferCatalog: { "@id": offerCatalogId },
      },
      {
        ...directBookingOfferCatalog({
          id: offerCatalogId,
          name: `Direct-book Enchanted Havens for ${page.primaryKeyword}`,
          offers: bookingOffers,
        }),
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#collection`,
        name: `Best Enchanted Havens for ${page.primaryKeyword}`,
        numberOfItems: properties.length,
        itemListElement: properties.map((property, index) => {
          const variant = primaryVariant(property)
          const href = `/havens/${property.slug}`
          return {
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(href),
            item: buildVacationRentalEntity(property, variant),
          }
        }),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  }
}

export function buildHubJsonLd({ hub, pages, heroImage, properties = [] }: { hub: SeoHub; pages: SeoLandingPage[]; reviews: Review[]; heroImage?: string; properties?: Property[] }) {
  const hubUrl = absoluteUrl(hub.path)
  const primaryImage = heroImage ? absoluteImageUrl(heroImage) : absoluteImageUrl(LOGO_PATH)
  const pagePaths = pages.map((page) => page.path)
  const matchedProperties = getHubMatchedProperties({ pages, catalog: properties })
  const propertyPaths = matchedProperties.map(({ property }) => `/havens/${property.slug}`)
  const spatialCoverage = placeCoverage(hubAreaNames(hub, pages, matchedProperties))

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${absoluteUrl()}#organization`,
        ...brandEntityFields({ knowsAbout: hub.keywords }),
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
        "@id": `${hubUrl}#webpage`,
        name: hub.title,
        url: hubUrl,
        description: hub.metaDescription,
        about: hub.keywords,
        primaryImageOfPage: pageImageObject({
          url: primaryImage,
          name: `${hub.title} primary image`,
          caption: `${hub.title} visual guide to Enchanted Havens private Pacific Northwest stays`,
        }),
        spatialCoverage,
        isPartOf: { "@id": `${absoluteUrl()}#website` },
        publisher: { "@id": `${absoluteUrl()}#organization` },
        hasPart: [
          ...webpageRefs(pagePaths),
          ...(matchedProperties.length ? [{ "@id": `${hubUrl}#matched-havens` }] : []),
        ],
        significantLink: significantLinks([...pagePaths, ...propertyPaths, "/havens"]),
        mainEntity: { "@id": `${hubUrl}#guides` },
        breadcrumb: { "@id": `${hubUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${hubUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl() },
          { "@type": "ListItem", position: 2, name: hub.title, item: hubUrl },
        ],
      },
      {
        "@type": "LodgingBusiness",
        "@id": `${absoluteUrl()}#lodging-brand`,
        ...brandEntityFields(),
        image: primaryImage,
        potentialAction: { "@type": "ReserveAction", target: absoluteUrl("/havens#availability") },
      },
      {
        "@type": "ItemList",
        "@id": `${hubUrl}#guides`,
        name: hub.title,
        numberOfItems: pages.length,
        itemListElement: pages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: page.title,
          url: absoluteUrl(page.path),
          item: {
            "@type": "WebPage",
            "@id": `${absoluteUrl(page.path)}#webpage`,
            name: page.title,
            url: absoluteUrl(page.path),
            description: page.metaDescription,
            about: [page.primaryKeyword, ...page.keywords],
            isPartOf: { "@id": `${hubUrl}#webpage` },
            mainEntity: { "@id": `${absoluteUrl(page.path)}#collection` },
            significantLink: significantLinks([...page.propertySlugs.map((slug) => `/havens/${slug}`), ...page.relatedPaths]),
          },
        })),
      },
      ...(matchedProperties.length
        ? [
            {
              "@type": "ItemList",
              "@id": `${hubUrl}#matched-havens`,
              name: `Havens most relevant to ${hub.title}`,
              numberOfItems: matchedProperties.length,
              itemListElement: matchedProperties.map(({ property }, index) => {
                const variant = primaryVariant(property)
                const href = `/havens/${property.slug}`
                return {
                  "@type": "ListItem",
                  position: index + 1,
                  url: absoluteUrl(href),
                  item: buildVacationRentalEntity(property, variant),
                }
              }),
            },
          ]
        : []),
      {
        "@type": "FAQPage",
        "@id": `${hubUrl}#faq`,
        mainEntity: hub.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  }
}
