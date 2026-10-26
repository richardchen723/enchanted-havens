import { z } from "zod"
import type { Quote } from "@/lib/schemas"

export const REFERRAL_COOKIE = "enchanted_referral"
export const REFERRAL_MAX_AGE = 30 * 24 * 60 * 60
export const referralCodeSchema = z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).transform((value) => value.toLowerCase())
const amount = z.coerce.number().finite().min(0).max(10000).multipleOf(0.01)
const optionalDate = z.string().date().nullable()

export const affiliateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(320),
  socialHandle: z.string().trim().max(160),
  code: referralCodeSchema,
  status: z.enum(["active", "inactive"]),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: amount,
  commissionType: z.enum(["percentage", "fixed"]),
  commissionValue: amount,
  startsOn: optionalDate,
  endsOn: optionalDate,
  notes: z.string().trim().max(2000),
}).superRefine((value, context) => {
  for (const kind of ["discount", "commission"] as const) {
    if (value[`${kind}Type`] === "percentage" && value[`${kind}Value`] > 100) {
      context.addIssue({ code: "custom", path: [`${kind}Value`], message: "Percentages cannot exceed 100%." })
    }
  }
  if (value.startsOn && value.endsOn && value.endsOn < value.startsOn) {
    context.addIssue({ code: "custom", path: ["endsOn"], message: "End date must be on or after the start date." })
  }
})

export type AffiliateInput = z.infer<typeof affiliateSchema>
export type Affiliate = AffiliateInput & { id: string; visits: number }
export const affiliateSnapshotSchema = z.object({
  affiliateId: z.string().uuid(),
  code: referralCodeSchema,
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: amount,
  discountAmount: z.number().nonnegative(),
  commissionType: z.enum(["percentage", "fixed"]),
  commissionValue: amount,
  commissionAmount: z.number().nonnegative(),
  revenueBasis: z.number().nonnegative(),
  currency: z.literal("USD"),
})
export type AffiliateSnapshot = z.infer<typeof affiliateSnapshotSchema>
export const commissionStatusSchema = z.enum(["owed", "paid", "cancelled"])
export type CommissionStatus = z.infer<typeof commissionStatusSchema>

export function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

// Exclude cleaning, taxes, deposits and other fees; never fall back to the grand total.
export function affiliateRevenueBasis(quote: Quote) {
  return money(quote.components.filter((component) => component.isIncludedInTotalPrice !== 0)
    .filter((component) => ["price", "accommodation"].includes(component.type.toLowerCase()) || component.name.toLowerCase() === "baserate")
    .reduce((sum, component) => sum + Math.max(0, component.total), 0))
}

export function affiliateIsEligible(affiliate: AffiliateInput, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  return affiliate.status === "active" && (!affiliate.startsOn || affiliate.startsOn <= today) && (!affiliate.endsOn || affiliate.endsOn >= today)
}

export function applyAffiliateSnapshot(quote: Quote, snapshot: AffiliateSnapshot): Quote {
  if (quote.currency !== "USD") throw new Error("Affiliate offers are available in USD only.")
  const basis = affiliateRevenueBasis(quote)
  const discount = money(Math.min(quote.total, basis, snapshot.discountType === "percentage" ? basis * snapshot.discountValue / 100 : snapshot.discountValue))
  if (!discount) return quote
  return {
    ...quote,
    total: money(quote.total - discount),
    components: [...quote.components, {
      type: "discount", name: "enchantedHavensReferral", title: `Partner offer · ${snapshot.code}`,
      value: -discount, total: -discount, quantity: 1, isIncludedInTotalPrice: 1, isMandatory: 1,
    }],
  }
}

export function applyAffiliate(quote: Quote, affiliate: Affiliate) {
  if (quote.currency !== "USD") throw new Error("Affiliate offers are available in USD only.")
  const revenueBasis = affiliateRevenueBasis(quote)
  if (revenueBasis <= 0) return { quote, snapshot: null }
  const snapshot: AffiliateSnapshot = {
    affiliateId: affiliate.id, code: affiliate.code,
    discountType: affiliate.discountType, discountValue: affiliate.discountValue, discountAmount: 0,
    commissionType: affiliate.commissionType, commissionValue: affiliate.commissionValue,
    commissionAmount: money(affiliate.commissionType === "percentage" ? revenueBasis * affiliate.commissionValue / 100 : affiliate.commissionValue),
    revenueBasis, currency: "USD",
  }
  const discounted = applyAffiliateSnapshot(quote, snapshot)
  snapshot.discountAmount = money(quote.total - discounted.total)
  return { quote: discounted, snapshot }
}

export function referralDestination(haven: string | null) {
  return haven && /^[a-z0-9-]{1,120}$/.test(haven) ? `/havens/${haven}` : "/havens"
}
