import type { Review } from "@/lib/schemas"

export function selectEditorialReviews(
  reviews: Review[],
  { limit = 3, minLength = 70, maxLength = 360 }: { limit?: number; minLength?: number; maxLength?: number } = {},
) {
  return reviews
    .filter((review) => review.rating >= 4.8)
    .filter((review) => {
      const length = review.text.trim().length
      return length >= minLength && length <= maxLength
    })
    .slice(0, limit)
}
