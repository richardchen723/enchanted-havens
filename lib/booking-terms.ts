import type { PropertyVariant } from "@/lib/schemas"

export type BookingTermsSummary = {
  policyName: "Moderate" | "Flexible"
  fullRefundDays: number
  partialRefundDays: number
  partialRefundPercent: number
  checkInStart: number
  checkInEnd: number | null
  checkOut: number
  refundableDamageDeposit: number
}

const flexibleListingIds = new Set([335403, 576478, 558676, 558678])
const threePmListingIds = new Set([146889, 178994, 184081])
const tenAmListingIds = new Set([146889, 178994, 184081])

export function getBookingTermsSummary(variant: Pick<PropertyVariant, "id">): BookingTermsSummary {
  const flexible = flexibleListingIds.has(variant.id)
  return {
    policyName: flexible ? "Flexible" : "Moderate",
    fullRefundDays: flexible ? 14 : 30,
    partialRefundDays: flexible ? 7 : 14,
    partialRefundPercent: 50,
    checkInStart: threePmListingIds.has(variant.id) ? 15 : 16,
    checkInEnd: variant.id === 576478 ? null : 23,
    checkOut: tenAmListingIds.has(variant.id) ? 10 : 11,
    refundableDamageDeposit: 0,
  }
}

function timeLabel(hour: number) {
  const normalized = ((hour + 11) % 12) + 1
  return `${normalized}:00 ${hour >= 12 ? "p.m." : "a.m."}`
}

export function bookingPolicyCopy(terms: BookingTermsSummary) {
  return `Full refund until ${terms.fullRefundDays} days before arrival; ${terms.partialRefundPercent}% refund until ${terms.partialRefundDays} days before arrival. After that point, the stay is non-refundable.`
}

export function arrivalCopy(terms: BookingTermsSummary) {
  const window = terms.checkInEnd
    ? `${timeLabel(terms.checkInStart)}–${timeLabel(terms.checkInEnd)}`
    : `from ${timeLabel(terms.checkInStart)}`
  return `Check-in ${window}; check-out by ${timeLabel(terms.checkOut)}.`
}
