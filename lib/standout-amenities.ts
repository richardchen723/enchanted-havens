import type { PropertyVariant } from "@/lib/schemas"

const preferredAmenities = [
  { label: "Private dock", pattern: /\bprivate dock\b/i },
  { label: "Sauna", pattern: /\bsauna\b/i },
  { label: "Zipline", pattern: /\bzip[ -]?line\b/i },
  { label: "Game room", pattern: /\bgame room\b/i },
  { label: "Pool table", pattern: /\bpool table\b/i },
  { label: "EV charger", pattern: /\belectric vehicle charger\b|\bev charger\b/i },
  { label: "Outdoor kitchen", pattern: /\boutdoor kitchen\b/i },
  { label: "Hot tub", pattern: /\bhot ?tub\b|\bjacuzzi\b/i },
  { label: "Kayaks", pattern: /\bkayak\b|\bkayaks\b|\bkayak canoe\b/i },
  { label: "Waterfront", pattern: /\bwaterfront\b|\boceanfront\b|\blakefront\b/i },
  { label: "Beach access", pattern: /\bbeach\b/i },
  { label: "Lake access", pattern: /\blake\b|\blakeside\b/i },
  { label: "Fire pit", pattern: /\bfire ?pit\b/i },
  { label: "Fireplace", pattern: /\bfireplace\b/i },
  { label: "Hammock", pattern: /\bhammock\b/i },
  { label: "Event-friendly", pattern: /\bsuitable for events\b|\bevent-friendly\b/i },
  { label: "Pet-friendly", pattern: /\bpets allowed\b|\bpet-friendly\b/i },
  { label: "Air conditioning", pattern: /\bair conditioning\b/i },
] as const

const amenityLabels = new Map<string, string>([
  ["kayak canoe", "Kayaks"],
  ["jacuzzi", "Hot tub"],
  ["electric vehicle charger", "EV charger"],
  ["pets allowed", "Pet-friendly"],
  ["beach", "Beach access"],
  ["lake", "Lake access"],
  ["suitable for events", "Event-friendly"],
  ["garden or backyard", "Private outdoor space"],
  ["free parking on premises", "Free parking"],
  ["wireless internet", "Wi-Fi"],
])

const lowSignalAmenity = /smoke alarm|carbon monoxide|first aid|fire extinguisher|essentials|shampoo|hangers|linens|towels|toilet paper|body soap|hot water|cleaning products|dishes and silverware|cooking basics|stove|refrigerator|microwave|oven|coffee maker|kitchen|wireless internet|wi-fi|wifi|parking/i

export function formatAmenityName(amenity: string) {
  const trimmed = amenity.trim()
  return amenityLabels.get(trimmed.toLowerCase()) || trimmed
}

export function getDisplayAmenities(amenities: string[]) {
  return amenities
    .map(formatAmenityName)
    .filter(Boolean)
    .filter((amenity, index, all) => all.findIndex((item) => item.toLowerCase() === amenity.toLowerCase()) === index)
}

export function getStandoutAmenities(variant: PropertyVariant, signals: string[] = [], limit = 8) {
  const source = [variant.name, variant.shortName, ...variant.amenities, ...signals].join("\n")
  const selected: string[] = preferredAmenities
    .filter((amenity) => amenity.pattern.test(source))
    .map((amenity) => amenity.label)

  const displayAmenities = getDisplayAmenities(variant.amenities)
  for (const amenity of displayAmenities) {
    if (selected.length >= limit) break
    if (lowSignalAmenity.test(amenity)) continue
    if (selected.some((item) => item.toLowerCase() === amenity.toLowerCase())) continue
    selected.push(amenity)
  }

  if (!selected.length) {
    selected.push(...displayAmenities.slice(0, limit))
  }

  return selected.slice(0, limit)
}
