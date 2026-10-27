import { getAirbnbReviewDestination } from "@/lib/airbnb"
import { arrivalCopy, getBookingTermsSummary } from "@/lib/booking-terms"
import type { Property, PropertyVariant } from "@/lib/schemas"

type FactDetail = { label: string; text: string }

export type VerifiedPropertyFacts = {
  listingId: number
  slug: string
  area: string
  city: string
  waterBody?: string
  waterAccess: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  sleeping: string
  details: FactDetail[]
  verifiedAmenities: string[]
  features: { hotTub: boolean; sauna: boolean; privateDock?: true }
  evEquipment?: "outlet" | "charger" | "none"
  source: { url: string; checkedAt: string; sections: string[] }
  ownerConfirmation?: { date: string; fact: string }
  pendingConfirmation: string[]
}

function listingSource(listingId: number, sections: string[]) {
  return { url: getAirbnbReviewDestination(listingId).href, checkedAt: "2026-10-27", sections: [...sections, "Things to know: check-in and checkout"] }
}

// Only confirmed facts belong here. Missing information is unknown, not false.
// Owner confirmations override conflicting listing text. This does not alter
// rates, cancellation terms, payment-processing fees, or upstream listings.
export const confirmedStayPolicies = {
  confirmedBy: "Richard Chen",
  confirmedAt: "2026-10-27",
  currency: "USD",
  petFee: 100,
  pets: "Pets are welcome with a USD 100 flat fee per stay. Notify the stay team at least one day before arrival and pay the pet fee before the access code is issued.",
  events: "Extra visitors and event-style use require written approval before booking.",
  eventAmenity: "Events require written approval before booking",
} as const

export const verifiedPropertyFacts: VerifiedPropertyFacts[] = [
  {
    listingId: 146889,
    slug: "blue-haven",
    area: "Lake Sutherland",
    city: "Port Angeles",
    waterBody: "Lake Sutherland",
    waterAccess: "Lake Sutherland waterfront with a private beach and a dock exclusively for guests.",
    bedrooms: 3,
    bathrooms: 1,
    maxGuests: 6,
    sleeping: "Three queen beds; one bedroom is unenclosed. The bathroom is downstairs.",
    details: [
      { label: "Access", text: "Approximately 30 steps from parking to the entrance; stairs between the upstairs bedrooms and bathroom." },
      { label: "Parking", text: "Dedicated roadside parking for four cars." },
      { label: "Water equipment", text: "Two kayaks, paddles, and life jackets. Guests may dock their own boat at the house dock." },
    ],
    verifiedAmenities: ["Private beach access", "Kayaks", "Lake access"],
    features: { hotTub: false, sauna: false, privateDock: true },
    evEquipment: "none",
    source: listingSource(146889, ["Beds & baths", "Kayaks", "Parking", "Boat launch", "Stairs"]),
    ownerConfirmation: { date: "2026-10-27", fact: "Richard Chen confirmed the dock is private for guests, no EV charging is provided, and the collection's hot tub/sauna inventory." },
    pendingConfirmation: [],
  },
  {
    listingId: 157299,
    slug: "sea-renity-haven",
    area: "Whidbey Island",
    city: "Oak Harbor",
    waterAccess: "An oceanfront bluff on Whidbey Island; beach access is at nearby public parks.",
    bedrooms: 4,
    bathrooms: 2.5,
    maxGuests: 12,
    sleeping: "One king, two queens, and two twin beds across four bedrooms, plus four folding mattresses and a crib.",
    details: [
      { label: "Access", text: "Single-level home with no steps." },
      { label: "Parking and arrival", text: "Three cars in front, with additional roadside space. The driveway is narrow and winding." },
      { label: "EV equipment", text: "A 240V, 50A Level 2 charger is provided." },
      { label: "Outdoor space", text: "Fenced backyard and an ocean-view deck." },
    ],
    verifiedAmenities: ["Oceanfront", "Ocean view", "EV charger", "Game room", "Pool table"],
    features: { hotTub: false, sauna: false },
    evEquipment: "charger",
    source: listingSource(157299, ["Listing overview", "Beds & baths", "Driveway and parking", "Outdoor"]),
    ownerConfirmation: { date: "2026-10-27", fact: "Richard Chen confirmed 12 guests: eight sleeping spaces in beds plus four folding mattresses; a single-level home with no steps; and the collection's hot tub/sauna inventory." },
    pendingConfirmation: [],
  },
  {
    listingId: 178403,
    slug: "emerald-haven",
    area: "Lake Sutherland",
    city: "Port Angeles",
    waterBody: "Lake Sutherland",
    waterAccess: "Lake Sutherland waterfront with a private dock.",
    bedrooms: 5,
    bathrooms: 2,
    maxGuests: 10,
    sleeping: "Four rooms with adult beds: two kings, one queen, and one double. The fifth bedroom has two toddler beds. Two folding mattresses and a crib add flexibility.",
    details: [
      { label: "Access", text: "Approximately 20 steps from parking to the entrance; bathrooms on both floors." },
      { label: "Parking and EV equipment", text: "Eight parking spaces. A 240V, 50A outlet is available; bring your own charging equipment." },
      { label: "Water and outdoor amenities", text: "Two kayaks, one paddleboard, life jackets, a hot tub, and a fire pit." },
    ],
    verifiedAmenities: ["Kayaks", "Paddle board", "EV outlet — bring your own charging equipment", "Lake access", "Fire pit"],
    features: { hotTub: true, sauna: false, privateDock: true },
    evEquipment: "outlet",
    source: listingSource(178403, ["Where you'll sleep", "Beds & baths", "Parking", "EV charger", "Boat launch", "Stairs"]),
    ownerConfirmation: { date: "2026-10-27", fact: "Richard Chen confirmed the collection's hot tub/sauna inventory." },
    pendingConfirmation: [],
  },
  {
    listingId: 178994,
    slug: "fair-haven",
    area: "Hood Canal",
    city: "Belfair",
    waterBody: "Hood Canal",
    waterAccess: "Private beach access on Hood Canal's south shore, across several outdoor levels and steps.",
    bedrooms: 3,
    bathrooms: 2.5,
    maxGuests: 10,
    sleeping: "Downstairs king and queen rooms; upstairs family room with a queen and two twins. Two folding mattresses and a crib. Two full baths downstairs, half bath upstairs.",
    details: [
      { label: "Beach access", text: "Steps lead to a shell-covered shore; bring water shoes." },
      { label: "Parking and EV equipment", text: "Two private spaces and a third roadside space; a 240V, 50A Level 2 charger is provided." },
      { label: "Outdoor amenities", text: "Barrel sauna, three kayaks, fire pit, and enclosed dog area." },
    ],
    verifiedAmenities: ["Private beach access", "Kayaks", "EV charger", "Fire pit"],
    features: { hotTub: false, sauna: true },
    evEquipment: "charger",
    source: listingSource(178994, ["Beds & baths", "Backyard", "The beach", "Parking"]),
    ownerConfirmation: { date: "2026-10-27", fact: "Richard Chen confirmed three kayaks and that Fair Haven is the only home with a sauna; also confirmed the hot tub inventory." },
    pendingConfirmation: [],
  },
  {
    listingId: 184081,
    slug: "aurora-haven",
    area: "Olympic Peninsula",
    city: "Port Angeles",
    waterAccess: "Hilltop ocean views on ten acres near Port Angeles.",
    bedrooms: 3,
    bathrooms: 3,
    maxGuests: 10,
    sleeping: "One king, one queen, and two twin beds provide six sleeping spaces across three bedrooms. Folding mattresses provide four more sleeping spaces, for ten guests total. A Pack 'n Play is also available.",
    details: [
      { label: "Access", text: "Single-level home with no steps, including the route from parking to the entrance." },
      { label: "Parking and EV equipment", text: "Ample on-site parking. A 240V, 50A Level 2 outlet is available; bring your own charging equipment." },
      { label: "Outdoor amenities", text: "Hot tub, zipline, fire pit, and game room." },
    ],
    verifiedAmenities: ["Ocean view", "Zipline", "Game room", "Fire pit", "EV outlet — bring your own charging equipment"],
    features: { hotTub: true, sauna: false },
    evEquipment: "outlet",
    source: listingSource(184081, ["The house", "Beds & baths", "Parking", "Listing description"]),
    ownerConfirmation: { date: "2026-10-27", fact: "Richard Chen confirmed 10 guests: six sleeping spaces in beds plus four on folding mattresses. This supersedes Airbnb's eight-adult description without assuming the number or size of mattresses. Also confirmed a single-level home with no steps from parking to entry and the collection's hot tub/sauna inventory." },
    pendingConfirmation: [],
  },
  {
    listingId: 335403,
    slug: "reflection-haven",
    area: "Lake Dawn",
    city: "Port Angeles",
    waterBody: "Lake Dawn",
    waterAccess: "Lake Dawn's north shore, with a private dock, a lakeside deck, and a fenced lawn leading to the water.",
    bedrooms: 4,
    bathrooms: 2,
    maxGuests: 10,
    sleeping: "Two king rooms, a queen room on the terrace level, and a room with two bunk beds.",
    details: [
      { label: "Access", text: "Three-story house; the main level has no steps." },
      { label: "Parking and EV equipment", text: "Three spaces in front and three by the community street; a Level 2 charger is provided." },
      { label: "Water and outdoor amenities", text: "Two kayaks, a canoe, a six-person hot tub, and a fire pit." },
    ],
    verifiedAmenities: ["Lake access", "Kayaks", "Canoe", "EV charger", "Fire pit"],
    features: { hotTub: true, sauna: false, privateDock: true },
    evEquipment: "charger",
    source: listingSource(335403, ["Listing description", "Beds & baths", "Yard", "Parking", "EV charger"]),
    ownerConfirmation: { date: "2026-10-27", fact: "Richard Chen confirmed Lake Dawn (not Lake Sutherland), a private dock, a three-story house with no steps on the main level, and the collection's hot tub/sauna inventory." },
    pendingConfirmation: [],
  },
]

export function getVerifiedPropertyFacts(listingId: number) {
  return verifiedPropertyFacts.find((facts) => facts.listingId === listingId)
}

export function propertySlugsOnWater(waterBody: string) {
  return verifiedPropertyFacts.filter((facts) => facts.waterBody === waterBody).map((facts) => facts.slug)
}

export function propertySlugsWithFeature(feature: keyof VerifiedPropertyFacts["features"]) {
  return verifiedPropertyFacts.filter((facts) => facts.features[feature]).map((facts) => facts.slug)
}

export function propertyFactDetails(facts: VerifiedPropertyFacts): FactDetail[] {
  return [
    { label: "Setting and water access", text: facts.waterAccess },
    { label: "Capacity and bathrooms", text: `Up to ${facts.maxGuests} guests · ${facts.bedrooms} bedrooms · ${facts.bathrooms} bathrooms.` },
    { label: "Sleeping arrangements", text: facts.sleeping },
    { label: "Check-in and checkout", text: `${arrivalCopy(getBookingTermsSummary({ id: facts.listingId }))} All times are local Pacific time.` },
    ...facts.details,
    { label: "Pets", text: confirmedStayPolicies.pets },
    { label: "Visitors and events", text: confirmedStayPolicies.events },
  ]
}

export function propertySleepingSummary(listingId: number) {
  const facts = getVerifiedPropertyFacts(listingId)
  return facts ? `Up to ${facts.maxGuests} guests, ${facts.bedrooms} bedrooms, and ${facts.bathrooms} bathrooms. ${facts.sleeping}` : ""
}

export function reconcileConfirmedDescription(listingId: number, description: string | undefined) {
  if (!description) return description
  // Exact known sentences only: preserve the rest of the upstream description,
  // including the explicitly deferred payment-processing disclosures.
  const previousCapacity = listingId === 157299
    ? "It can comfortably sleep 10 people with a folding memory foam mattress we supply."
    : listingId === 184081
      ? "The property can comfortably sleep 8 adults on one King size bed, one Queen size bed, two single beds, and two thick folding mattresses."
      : undefined
  const corrected = previousCapacity ? description.replace(previousCapacity, propertySleepingSummary(listingId)) : description
  // Public copy describes what is supplied; retain preparation and safety notes.
  return corrected
    .replace("Although currently without a dishwasher, you'll find", "You'll find")
    .replace("We are not providing motorboats at this time. But for boaters,", "For boaters,")
    .replace("Please note that while we do not provide motorboats, guests", "Guests")
}

export function applyVerifiedVariantFacts(variant: PropertyVariant): PropertyVariant {
  const facts = getVerifiedPropertyFacts(variant.id)
  if (!facts) return variant
  const amenities = variant.amenities.filter((amenity) => {
    if (/\bevents?\b|event-friendly/i.test(amenity)) return false
    if (/\bhot ?tub\b|\bjacuzzi\b|\bsauna\b/i.test(amenity)) return false
    if (facts.features.privateDock && /\bprivate dock\b/i.test(amenity)) return false
    return !facts.evEquipment || !/\bev\s+(?:charger|charging|outlet)\b|electric vehicle charg/i.test(amenity)
  })
  const hasEventAmenity = variant.amenities.some((amenity) => /\bevents?\b|event-friendly/i.test(amenity))
  return {
    ...variant,
    location: facts.area,
    city: facts.city,
    region: "Washington",
    bedrooms: facts.bedrooms,
    bathrooms: facts.bathrooms,
    guests: facts.maxGuests,
    ...(variant.fullDescription ? { fullDescription: reconcileConfirmedDescription(variant.id, variant.fullDescription) } : {}),
    amenities: [
      ...(facts.features.privateDock ? ["Private dock"] : []),
      ...(facts.features.hotTub ? ["Hot tub"] : []),
      ...(facts.features.sauna ? ["Barrel sauna"] : []),
      ...facts.verifiedAmenities,
      ...amenities,
      ...(hasEventAmenity ? [confirmedStayPolicies.eventAmenity] : []),
    ].filter((item, index, all) =>
      all.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index,
    ),
    currency: "USD",
  }
}

export function applyVerifiedPropertyFacts(property: Property): Property {
  const facts = getVerifiedPropertyFacts(property.variants[0]?.id)
  if (!facts) return property
  return {
    ...property,
    eyebrow: facts.area,
    location: `${facts.area}, ${facts.city}, Washington`,
    variants: property.variants.map(applyVerifiedVariantFacts),
  }
}
