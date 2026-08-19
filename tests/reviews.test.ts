import { describe, expect, it } from "vitest"
import { selectEditorialReviews } from "@/lib/reviews"

const review = (id: string, rating: number, text: string) => ({
  id,
  guestName: "Guest",
  rating,
  text,
  date: "2026",
  propertyName: "Blue Haven",
})

describe("editorial review selection", () => {
  it("keeps concise high-rated reviews and excludes long or lower-rated copy", () => {
    const concise = "A memorable stay with beautiful lake views, thoughtful details, and a setting our family already wants to revisit."
    const result = selectEditorialReviews([
      review("low", 4.2, concise),
      review("long", 5, "A".repeat(500)),
      review("concise", 5, concise),
    ])

    expect(result.map((item) => item.id)).toEqual(["concise"])
  })
})
