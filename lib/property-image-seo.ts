import { verifiedPropertyPhotos } from "@/lib/property-photos"

// A property amenity does not identify what an individual photograph depicts.
// Use a neutral caption until a photograph has a verified editorial caption.
export function propertyGalleryImageAlt({ name, location, index, src }: { name: string; location: string; index: number; tags?: string[]; src?: string }) {
  const caption = src ? Object.values(verifiedPropertyPhotos).flat().find((photo) => new URL(photo.url).pathname === new URL(src, "https://enchantedhavens.com").pathname)?.caption : undefined
  if (caption) return `${name}: ${caption.toLowerCase()} in ${location}`
  return `${name} gallery view ${index + 1} in ${location}`
}

export function propertyGalleryImageTitle({ name, index }: { name: string; index: number }) {
  return `${name} gallery image ${index + 1}`
}
