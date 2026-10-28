import { verifiedPropertyPhotos } from "@/lib/property-photos"
import galleryPhotoCaptions from "@/lib/gallery-photo-captions.json"

const captions: Record<string, string> = { ...galleryPhotoCaptions }
for (const photo of Object.values(verifiedPropertyPhotos).flat()) {
  captions[new URL(photo.url).pathname] = photo.caption
}

// Visually reviewed on 2026-10-27. Match the image itself, not its position or
// resizing query. New Hostaway photos retain a neutral label until reviewed.
export function propertyGalleryCaption(src?: string) {
  if (!src) return undefined
  try {
    return captions[new URL(src, "https://enchantedhavens.com").pathname]
  } catch {
    return undefined
  }
}

// A property amenity does not identify what an individual photograph depicts.
// Use a neutral caption until a photograph has a verified editorial caption.
export function propertyGalleryImageAlt({ name, location, index, src }: { name: string; location: string; index: number; tags?: string[]; src?: string }) {
  const caption = propertyGalleryCaption(src)
  if (caption) return `${name}: ${caption.toLowerCase()} in ${location}`
  return `${name} gallery view ${index + 1} in ${location}`
}

export function propertyGalleryImageTitle({ name, index }: { name: string; index: number }) {
  return `${name} gallery image ${index + 1}`
}
