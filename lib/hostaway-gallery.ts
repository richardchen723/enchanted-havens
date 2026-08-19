import "server-only"

import { unstable_cache } from "next/cache"
import { getHostawayListing } from "@/lib/hostaway"
import { getHighResolutionImageSet } from "@/lib/images"

export const getCachedHostawayGallery = unstable_cache(
  async (listingId: number) => getHighResolutionImageSet((await getHostawayListing(listingId)).images),
  ["hostaway-gallery-v3"],
  { revalidate: 3600, tags: ["catalog"] },
)
