import { z } from "zod"
import { OWNER_PROPERTY_FEATURES } from "@/lib/owner-property-features"

const singleLine = (max: number) => z.string().trim().max(max).refine((value) => !/[\r\n\u0000]/.test(value), "Use a single line.")
// FormData supplies strings. Keep blank values invalid rather than coercing them to zero.
const roomCount = (schema: z.ZodNumber) => z.preprocess((value) => typeof value === "string" && value.trim() !== "" ? Number(value) : value, schema)

export const ownerInquirySchema = z.object({
  submissionKey: z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional()),
  name: singleLine(120).refine((value) => value.length >= 2, "Please enter your name."),
  email: singleLine(254).pipe(z.email()),
  propertyAddress: singleLine(300).refine((value) => value.length >= 8, "Please enter the full property address, including city, state, and ZIP code."),
  bedrooms: roomCount(z.number().int().min(0).max(50)),
  bathrooms: roomCount(z.number().min(0.5).max(50).multipleOf(0.5)),
  features: z.array(z.enum(OWNER_PROPERTY_FEATURES)).max(OWNER_PROPERTY_FEATURES.length).default([]).transform((values) => [...new Set(values)]),
  phone: singleLine(40).default(""),
  message: z.string().trim().max(4000).default(""),
  website: z.string().max(0).default(""),
  utmSource: singleLine(120).default(""),
  utmMedium: singleLine(120).default(""),
  utmCampaign: singleLine(200).default(""),
  referrerHost: singleLine(253).default(""),
})

export type OwnerInquiry = z.infer<typeof ownerInquirySchema>
