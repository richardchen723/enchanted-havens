const HIGH_RES_WIDTH = 3840
const MAIN_HOUSE_WIDTH = 2400

function targetWidthForHostawayPath(pathname: string) {
  return pathname.includes("57690-558678-") ? MAIN_HOUSE_WIDTH : HIGH_RES_WIDTH
}

function qualityForHostawayPath(pathname: string) {
  return pathname.includes("57690-558678-") ? 82 : 92
}

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

    url.searchParams.set("width", String(targetWidthForHostawayPath(url.pathname)))
    url.searchParams.set("quality", String(qualityForHostawayPath(url.pathname)))
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
