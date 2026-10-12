const HIGH_RES_WIDTH = 3840
export function getHighResolutionImageUrl(image: string) {
  if (image.startsWith("/")) return image

  try {
    const url = new URL(image)
    const isBookingCdn = url.hostname === "bookingenginecdn.hostaway.com" || url.hostname === "bookingenginecdn-2.hostaway.com"
    const isHostawayS3 = url.hostname === "hostaway-platform.s3.us-west-2.amazonaws.com" && url.pathname.startsWith("/listing/")

    if (!isBookingCdn && !isHostawayS3) return image

    if (isHostawayS3) {
      url.protocol = "https:"
      url.hostname = "bookingenginecdn.hostaway.com"
    }

    url.searchParams.set("width", String(HIGH_RES_WIDTH))
    url.searchParams.set("quality", "92")
    url.searchParams.set("format", "webp")
    url.searchParams.set("v", url.searchParams.get("v") || "2")
    return url.toString()
  } catch {
    return image
  }
}

export function getHighResolutionImageSet(images: string[]) {
  return images.map(getHighResolutionImageUrl)
}
