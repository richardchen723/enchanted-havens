import { absoluteUrl } from "@/lib/utils"

type SchemaRef = { "@id": string }

export type DirectBookingOffer = {
  "@type": "Offer"
  "@id": string
  name: string
  url: string
  availability: "https://schema.org/LimitedAvailability"
  businessFunction: "https://purl.org/goodrelations/v1#LeaseOut"
  seller: SchemaRef
  itemOffered: SchemaRef | { "@type": "LodgingBusiness"; name: string; url: string }
  potentialAction: { "@type": "ReserveAction"; target: string }
}

export function directBookingOffer({
  id,
  name,
  url,
  reserveTarget,
  itemOfferedId,
  itemOfferedName,
  sellerId = `${absoluteUrl()}#organization`,
}: {
  id?: string
  name: string
  url: string
  reserveTarget?: string
  itemOfferedId?: string
  itemOfferedName?: string
  sellerId?: string
}): DirectBookingOffer {
  const absoluteOfferUrl = url.startsWith("http") ? url : absoluteUrl(url)

  return {
    "@type": "Offer",
    "@id": id || `${absoluteOfferUrl}#offer`,
    name,
    url: absoluteOfferUrl,
    availability: "https://schema.org/LimitedAvailability",
    businessFunction: "https://purl.org/goodrelations/v1#LeaseOut",
    seller: { "@id": sellerId },
    itemOffered: itemOfferedId
      ? { "@id": itemOfferedId }
      : { "@type": "LodgingBusiness", name: itemOfferedName || name, url: absoluteOfferUrl },
    potentialAction: {
      "@type": "ReserveAction",
      target: reserveTarget || `${absoluteOfferUrl}#reserve`,
    },
  }
}

export function directBookingOfferCatalog({ id, name, offers }: { id: string; name: string; offers: DirectBookingOffer[] }) {
  return {
    "@type": "OfferCatalog" as const,
    "@id": id,
    name,
    numberOfItems: offers.length,
    itemListElement: offers,
  }
}

export function schemaRefs(nodes: Array<{ "@id": string }>) {
  return nodes.map((node) => ({ "@id": node["@id"] }))
}
