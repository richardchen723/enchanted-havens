type InquiryHrefInput = {
  property: string
  variant?: string
  checkIn?: string
  checkOut?: string
  guests?: number | string
  tripType?: string
  preservedQuery?: string
  returnTo?: string
}

export function buildInquiryHref({
  property,
  variant,
  checkIn,
  checkOut,
  guests,
  tripType,
  preservedQuery = "",
  returnTo,
}: InquiryHrefInput) {
  const params = new URLSearchParams(preservedQuery)
  params.set("property", property)
  if (variant) params.set("variant", variant)
  if (checkIn) params.set("checkIn", checkIn)
  else params.delete("checkIn")
  if (checkOut) params.set("checkOut", checkOut)
  else params.delete("checkOut")
  if (guests) params.set("guests", String(guests))
  if (tripType) params.set("tripType", tripType)
  if (returnTo) params.set("returnTo", returnTo)
  return `/contact?${params.toString()}`
}

export function safeContactReturnPath(value: string | string[] | undefined, fallback: string) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return fallback
  try {
    const parsed = new URL(value, "https://enchantedhavens.com")
    if (parsed.origin !== "https://enchantedhavens.com" || !parsed.pathname.startsWith("/havens/")) return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
