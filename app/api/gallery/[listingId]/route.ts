import { allowedListingIds, getPropertyByListingId } from "@/lib/editorial"
import { isHostawayConfigured } from "@/lib/hostaway"
import { getCachedHostawayGallery } from "@/lib/hostaway-gallery"

export async function GET(_request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const listingId = Number((await params).listingId)
  if (!Number.isInteger(listingId) || !allowedListingIds.includes(listingId)) {
    return Response.json({ error: "Gallery not found." }, { status: 404 })
  }

  try {
    if (isHostawayConfigured()) {
      const images = await getCachedHostawayGallery(listingId)
      return Response.json(
        { images, count: images.length, source: "hostaway" },
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
      )
    }

    const variant = getPropertyByListingId(listingId)?.variants.find((item) => item.id === listingId)
    const images = variant?.images || []
    return Response.json({ images, count: images.length, source: "editorial" })
  } catch (error) {
    console.error("Unable to load Hostaway gallery", error)
    return Response.json({ error: "The complete gallery is temporarily unavailable." }, { status: 503 })
  }
}
