import { z } from "zod"
import { isValidUsPhone, toE164UsPhone } from "@/lib/phone"

const isoDateSchema = z.string().refine((value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, year, month, day] = match
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return parsed.getUTCFullYear() === Number(year) && parsed.getUTCMonth() === Number(month) - 1 && parsed.getUTCDate() === Number(day)
}, "Expected a valid date in YYYY-MM-DD format")

const imageSourceSchema = z.union([
  z.string().url(),
  z.string().regex(/^\/images\/.+/, "Expected an absolute URL or public image path"),
])

export const propertyVariantSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  description: z.string(),
  fullDescription: z.string().optional(),
  location: z.string(),
  city: z.string(),
  region: z.string(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  guests: z.number().int().nonnegative(),
  bedrooms: z.number().nonnegative(),
  bathrooms: z.number().nonnegative(),
  beds: z.number().nonnegative().optional(),
  images: z.array(imageSourceSchema).min(1),
  amenities: z.array(z.string()),
  houseRules: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  reviewsCount: z.number().int().nonnegative().default(0),
  startingPrice: z.number().nonnegative().nullable().optional(),
  currency: z.string().default("USD"),
  bookingEngineUrl: z.string().url().optional(),
})

export const propertySchema = z.object({
  slug: z.string().min(1),
  displayName: z.string().min(1),
  eyebrow: z.string(),
  location: z.string(),
  narrative: z.string(),
  longNarrative: z.string(),
  heroImage: imageSourceSchema,
  gallery: z.array(imageSourceSchema),
  experienceTags: z.array(z.string()),
  featuredOrder: z.number().int(),
  featured: z.boolean(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  variants: z.array(propertyVariantSchema).min(1),
  estate: z.boolean().default(false),
})

export const reviewSchema = z.object({
  id: z.string(),
  guestName: z.string(),
  rating: z.number().min(0).max(5),
  text: z.string(),
  date: z.string(),
  propertyName: z.string(),
})

const calendarFlagSchema = z.union([z.number(), z.string(), z.boolean()]).transform((value) => {
  if (typeof value === "boolean") return value ? 1 : 0
  return Number(value) === 1 ? 1 : 0
})

const calendarNumberSchema = z.union([z.number(), z.string()]).transform((value) => Number(value))

export const calendarReservationSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  arrivalDate: isoDateSchema,
  departureDate: isoDateSchema,
  status: z.string().optional(),
})

export const calendarEntrySchema = z.object({
  date: isoDateSchema,
  isAvailable: calendarFlagSchema.optional(),
  available: calendarFlagSchema.optional(),
  status: z.string().optional(),
  price: calendarNumberSchema.nullable().optional(),
  minimumStay: calendarNumberSchema.nullable().optional(),
  maximumStay: calendarNumberSchema.nullable().optional(),
  reservations: z.array(calendarReservationSchema).optional().default([]),
  closedOnArrival: calendarFlagSchema.nullable().optional(),
  closedOnDeparture: calendarFlagSchema.nullable().optional(),
  countAvailableUnits: calendarNumberSchema.nullable().optional(),
  availableUnitsToSell: calendarNumberSchema.nullable().optional(),
  desiredUnitsToSell: calendarNumberSchema.nullable().optional(),
  countReservedUnits: calendarNumberSchema.nullable().optional(),
  countBlockingReservations: calendarNumberSchema.nullable().optional(),
  countBlockedUnits: calendarNumberSchema.nullable().optional(),
})

export const calendarMapSchema = z.record(z.string(), calendarEntrySchema)

export const quoteComponentSchema = z.object({
  id: z.number().nullable().optional(),
  listingFeeSettingId: z.number().nullable().optional(),
  type: z.string(),
  name: z.string(),
  title: z.string(),
  value: z.number(),
  total: z.number(),
  quantity: z.number().nullable().optional(),
  isIncludedInTotalPrice: z.number().optional(),
  isMandatory: z.number().nullable().optional(),
})

export const quoteSchema = z.object({
  listingId: z.number(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().int().positive(),
  nights: z.number().int().positive(),
  total: z.number().nonnegative(),
  currency: z.string(),
  components: z.array(quoteComponentSchema),
  available: z.boolean(),
})

export const searchRequestSchema = z.object({
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  guests: z.coerce.number().int().min(1).max(60),
})

export const quoteRequestSchema = searchRequestSchema.extend({
  listingId: z.coerce.number().int().positive(),
  couponCode: z.string().trim().max(24).optional(),
})

export const guestSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().trim().refine(isValidUsPhone, "Enter a valid 10-digit US phone number.").transform(toE164UsPhone),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().length(2).default("US"),
  specialRequests: z.string().max(2000).optional(),
})

export const checkoutSetupSchema = quoteRequestSchema.extend({
  propertySlug: z.string(),
  variantSlug: z.string(),
  guest: guestSchema,
})

export const checkoutConfirmSchema = z.object({
  sessionId: z.string().uuid(),
  setupIntentId: z.string().startsWith("seti_"),
  consent: z.literal(true),
})

export const contactSchema = z.object({
  submissionKey: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  tripType: z.string().max(80).optional(),
  message: z.string().max(4000).default(""),
  website: z.string().max(0).optional(),
})

export type Property = z.infer<typeof propertySchema>
export type PropertyVariant = z.infer<typeof propertyVariantSchema>
export type Review = z.infer<typeof reviewSchema>
export type CalendarEntry = z.infer<typeof calendarEntrySchema>
export type CalendarMap = z.infer<typeof calendarMapSchema>
export type Quote = z.infer<typeof quoteSchema>
export type QuoteComponent = z.infer<typeof quoteComponentSchema>
export type Guest = z.infer<typeof guestSchema>
