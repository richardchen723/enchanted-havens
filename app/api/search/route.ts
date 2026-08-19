import { getCatalog } from "@/lib/catalog"
import { getHostawayQuote, isHostawayConfigured, isListingAvailable } from "@/lib/hostaway"
import { searchRequestSchema } from "@/lib/schemas"
import { nightsBetween } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const input = searchRequestSchema.parse(await request.json())
    if (nightsBetween(input.checkIn, input.checkOut) < 1) return Response.json({ error: "Departure must be after arrival." }, { status: 400 })
    if (!isHostawayConfigured()) return Response.json({ error: "Live availability will be enabled when Hostaway credentials are connected." }, { status: 503 })
    const catalog = await getCatalog()
    const checkedProperties = await Promise.all(catalog.map(async (property) => {
      const eligible = property.variants.filter((variant) => variant.guests >= input.guests)
      const checked = await Promise.all(eligible.map(async (variant) => {
        try {
          const available = await isListingAvailable(variant.id, input.checkIn, input.checkOut)
          if (!available) return null
          const quote = await getHostawayQuote(variant.id, input.checkIn, input.checkOut, input.guests)
          if (!quote.available) return null
          return {
            listingId: variant.id,
            variantSlug: variant.slug,
            quote: { total: quote.total, currency: quote.currency, nights: quote.nights },
          }
        } catch {
          return null
        }
      }))
      const availableVariants = checked.filter(Boolean)
      return availableVariants.length
        ? {
            propertySlug: property.slug,
            availableListingIds: availableVariants.map((item) => item!.listingId),
            variants: availableVariants,
          }
        : null
    }))
    const results = checkedProperties.filter((result) => result !== null)
    return Response.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid search request"
    return Response.json({ error: message }, { status: 400 })
  }
}
