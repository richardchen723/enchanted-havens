import { absoluteUrl } from "@/lib/utils"
import { STAY_LIMITS } from "@/lib/public-stay-request"

const text = { type: "string" }
const integer = { type: "integer" }
const number = { type: "number" }
const timestamp = { type: "string", format: "date-time" }
const url = { type: "string", format: "uri" }
const usd = { type: "string", const: "USD" }
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const array = (items: object) => ({ type: "array", items })
const object = (properties: Record<string, unknown>, required: string[] = Object.keys(properties)) => ({ type: "object", properties, required })
const query = (name: string, schema: object, description: string, required = true) => ({ name, in: "query", required, schema, description })
const json = (description: string, schema: object) => ({ description, content: { "application/json": { schema } } })
const freshness = { generatedAt: timestamp, expiresAt: timestamp }
const selection = object({ checkIn: { type: "string", format: "date" }, checkOut: { type: "string", format: "date" }, guests: { type: "integer", minimum: 1, maximum: 60 } })
const stayParameters = [
  query("checkIn", { type: "string", format: "date" }, "Arrival calendar date in America/Los_Angeles, today or later."),
  query("checkOut", { type: "string", format: "date" }, `Departure date; 1–${STAY_LIMITS.maxNights} nights after arrival and within ${STAY_LIMITS.maxAdvanceDays} days of today.`),
  query("guests", { type: "integer", minimum: 1, maximum: 60 }, "Total guests; must not exceed the selected home's capacity."),
  ...["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "msclkid"].map((key) => query(key, { type: "string", maxLength: 256 }, "Optional attribution preserved in property and booking URLs.", false)),
]
const failures = {
  "400": json("Invalid dates, guests, parameters, or duplicate parameters.", ref("Error")),
  "414": json("Query exceeds 2048 characters.", ref("Error")),
  "429": { ...json("Per-instance request limit exceeded. Honor Retry-After: 60.", ref("Error")), headers: { "Retry-After": { schema: text } } },
}

export function agentOpenApi() {
  return {
    openapi: "3.1.1", info: { title: "Enchanted Havens travel planning", version: "1.0.0", description: "Public read-only facts and live USD pricing for six active Pacific Northwest vacation homes. These operations never create a reservation, charge a card, or hold inventory. Quote totals are standard public rates; coupon/referral adjustments and optional extras are confirmed in the guest's checkout. Do not treat unknown availability as sold out. Search/quote responses are not cached. Quotes must be refreshed after expiresAt and are always revalidated at checkout. Maximum query length: 2048; no duplicate parameters. Only the documented parameters and bounded utm_* attribution are accepted. Limits apply per server instance: 20 live requests per minute per connection; at most two homes checked concurrently per search, 15-second upstream deadline per home." },
    servers: [{ url: absoluteUrl() }], security: [],
    externalDocs: { url: absoluteUrl("/agents"), description: "Workflow, freshness, and handoff instructions" },
    paths: {
      "/agent/catalog": { get: { operationId: "listHavens", summary: "Get active homes, confirmed facts, capacity, source links, and canonical IDs", responses: { "200": json("Public catalog, refreshed at most hourly. Facts have their own checked-at dates.", ref("Catalog")), "503": json("Catalog temporarily unavailable.", ref("Error")) } } },
      "/agent/search": { get: { operationId: "searchHavens", summary: "Check all homes large enough for the party", parameters: stayParameters, responses: { "200": json("Complete or partial results. Each eligible home has its own available, unavailable, or unknown status.", ref("Search")), ...failures, "503": json("All candidate homes have unknown availability. Retry later; this does not mean sold out.", { oneOf: [ref("Search"), ref("Error")] }) } } },
      "/agent/quote": { get: { operationId: "quoteHaven", summary: "Get one home's dated USD price breakdown and booking handoff", parameters: [query("listingId", { type: "integer", minimum: 1 }, "An active listingId from the catalog."), ...stayParameters], responses: { "200": json("Available at time checked; no reservation or price hold.", ref("QuoteResult")), ...failures, "404": json("Unknown or retired home.", ref("Error")), "409": json("Confirmed unavailable for the selected stay.", ref("QuoteResult")), "503": json("Availability or price could not be confirmed.", { oneOf: [ref("QuoteResult"), ref("Error")] }) } } },
    },
    components: { schemas: {
      Selection: selection,
      Error: object({ status: { enum: ["invalid_request", "unknown"] }, code: text, error: text }),
      Price: object({ listingId: integer, checkIn: text, checkOut: text, guests: integer, nights: integer, currency: usd, total: number, components: array(object({ type: text, label: text, amount: number, includedInTotal: { type: "boolean" }, mandatory: { type: ["boolean", "null"] } })), priceContext: { const: "standard_public_rate" }, finalPriceRevalidationRequired: { const: true }, inventoryHeld: { const: false }, petPolicy: text }),
      StayResult: object({ id: text, listingId: integer, name: text, status: { enum: ["available", "unavailable", "unknown"] }, reason: text, ...freshness, propertyUrl: url, bookingUrl: url, quote: ref("Price") }, ["id", "listingId", "status", "generatedAt", "expiresAt", "propertyUrl", "bookingUrl"]),
      QuoteResult: { allOf: [ref("StayResult"), object({ version: text, selection: ref("Selection"), currency: usd })] },
      Search: object({ version: text, status: { enum: ["complete", "partial", "unknown"] }, selection: ref("Selection"), currency: usd, ...freshness, unknownCount: integer, results: array(ref("StayResult")), catalogUrl: url }),
      Property: object({ id: text, listingId: integer, slug: text, name: text, canonicalUrl: url, currency: usd, location: object({ area: text, city: text, region: text, country: text, coordinates: object({ latitude: number, longitude: number }) }), maxGuests: integer, bedrooms: number, bathrooms: number, sleepingArrangements: text, amenities: array(text), details: array(object({ label: text, text })), images: array(url), factsCheckedAt: { type: "string", format: "date" }, sourceUrl: url, reviews: { anyOf: [object({ rating: number, reviewCount: integer, checkedAt: { type: "string", format: "date" }, sourceUrl: url }), { type: "null" }] } }),
      Catalog: object({ version: text, ...freshness, currency: usd, propertyCount: integer, properties: array(ref("Property")), links: object({ documentation: url, specification: url, search: url, quote: url }) }),
    } },
  }
}
