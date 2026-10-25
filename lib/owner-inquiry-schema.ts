import { z } from "zod"

const singleLine = (max: number) => z.string().trim().max(max).refine((value) => !/[\r\n\u0000]/.test(value), "Use a single line.")

export const ownerInquirySchema = z.object({
  submissionKey: z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional()),
  name: singleLine(120).refine((value) => value.length >= 2, "Please enter your name."),
  email: singleLine(254).pipe(z.email()),
  propertyLocation: singleLine(300).refine((value) => value.length >= 2, "Please enter a town or area."),
  phone: singleLine(40).default(""),
  message: z.string().trim().max(4000).default(""),
  website: z.string().max(0).default(""),
  utmSource: singleLine(120).default(""),
  utmMedium: singleLine(120).default(""),
  utmCampaign: singleLine(200).default(""),
  referrerHost: singleLine(253).default(""),
})

export type OwnerInquiry = z.infer<typeof ownerInquirySchema>
