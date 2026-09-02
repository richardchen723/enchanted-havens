"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  clearAdminSession,
  createAdminAccessToken,
  getAdminUserByEmail,
  inviteAdminUser,
  removeAdminUser,
  requireAdminUser,
  requireAdminOwner,
  revokeAdminAccessToken,
} from "@/lib/admin-auth"
import { sendAdminAccessEmail } from "@/lib/email"
import { absoluteUrl } from "@/lib/utils"
import { createPropertyCoupon, saveCouponPagePromotions, setPropertyCouponActive } from "@/lib/coupons"
import { getCatalog } from "@/lib/catalog"
import { getCouponPromotionPagePaths, normalizeCouponPromotionPath } from "@/lib/coupon-promotion-pages"

const emailSchema = z.string().trim().toLowerCase().email().max(320)
const inviteSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: emailSchema,
})
const userIdSchema = z.string().uuid()
const optionalPositiveNumber = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.coerce.number().positive().optional(),
)
const optionalPositiveInteger = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.coerce.number().int().positive().optional(),
)
const couponSchema = z.object({
  propertySlug: z.string().trim().min(1).max(120),
  propertySlugs: z.array(z.string().trim().min(1).max(120)).min(1).max(50),
  code: z.string().trim().min(3).max(24).regex(/^[A-Za-z0-9_-]+$/),
  internalName: z.string().trim().max(160).optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive().max(10000),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiresOn: z.preprocess((value) => value === "" || value === null ? undefined : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  minimumNights: optionalPositiveInteger,
  minimumSubtotal: optionalPositiveNumber,
  maxRedemptions: optionalPositiveInteger,
  maxRedemptionsPerGuest: optionalPositiveInteger,
}).superRefine((value, context) => {
  if (value.discountType === "percentage" && value.discountValue > 100) {
    context.addIssue({ code: "custom", path: ["discountValue"], message: "Percentage coupons cannot exceed 100%." })
  }
  if (value.expiresOn && value.expiresOn < value.validFrom) {
    context.addIssue({ code: "custom", path: ["expiresOn"], message: "The expiration date must be on or after the start date." })
  }
})
const couponToggleSchema = z.object({
  couponId: z.string().uuid(),
  propertySlug: z.string().trim().min(1).max(120),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
})
const couponAdvertisingSchema = z.object({
  couponId: z.string().uuid(),
  propertySlug: z.string().trim().min(1).max(120),
  pagePaths: z.array(z.string().trim().min(1).max(300)).max(100),
})

export async function requestAdminSignInAction(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"))
  if (!parsed.success) redirect("/admin/login?error=invalid-email")

  let destination = "/admin/login?sent=1"
  try {
    const user = await getAdminUserByEmail(parsed.data)
    if (user) {
      const access = await createAdminAccessToken(user.id, "sign_in")
      if (access) {
        const sent = await sendAdminAccessEmail({
          email: user.email,
          fullName: user.fullName,
          purpose: "sign_in",
          accessUrl: absoluteUrl(`/admin/auth/verify?token=${encodeURIComponent(access.token)}`),
        })
        if (!sent) {
          await revokeAdminAccessToken(access.token)
          destination = "/admin/login?error=email-not-configured"
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "The admin database is not configured.") {
      destination = "/admin/login?error=database-not-configured"
    } else {
      console.error("Unable to send admin sign-in link", error)
      destination = "/admin/login?error=send-failed"
    }
  }

  redirect(destination)
}

export async function inviteAdminAction(formData: FormData) {
  const owner = await requireAdminOwner()
  const parsed = inviteSchema.safeParse({ fullName: formData.get("fullName"), email: formData.get("email") })
  if (!parsed.success) redirect("/admin/dashboard?invite=1&error=invalid-invite#team")

  let destination = "/admin/dashboard?team=1&notice=invite-sent#team"
  try {
    const user = await inviteAdminUser({ ...parsed.data, invitedBy: owner.id })
    const access = await createAdminAccessToken(user.id, "invite")
    if (!access) {
      destination = "/admin/dashboard?team=1&notice=invite-recently-sent#team"
    } else {
      const sent = await sendAdminAccessEmail({
        email: user.email,
        fullName: user.fullName,
        purpose: "invite",
        invitedBy: owner.fullName,
        accessUrl: absoluteUrl(`/admin/auth/verify?token=${encodeURIComponent(access.token)}`),
      })
      if (!sent) {
        await revokeAdminAccessToken(access.token)
        destination = "/admin/dashboard?invite=1&error=email-not-configured#team"
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("already has")) {
      destination = "/admin/dashboard?invite=1&error=already-admin#team"
    } else {
      console.error("Unable to invite administrator", error)
      destination = "/admin/dashboard?invite=1&error=invite-failed#team"
    }
  }

  revalidatePath("/admin/dashboard")
  redirect(destination)
}

export async function removeAdminAction(formData: FormData) {
  await requireAdminOwner()
  const parsed = userIdSchema.safeParse(formData.get("userId"))
  if (!parsed.success) redirect("/admin/dashboard?team=1&error=invalid-user#team")

  const removed = await removeAdminUser(parsed.data)
  revalidatePath("/admin/dashboard")
  redirect(`/admin/dashboard?team=1&${removed ? "notice=access-removed" : "error=remove-failed"}#team`)
}

export async function signOutAdminAction() {
  await clearAdminSession()
  redirect("/admin/login?signedOut=1")
}

export async function createCouponAction(formData: FormData) {
  const viewer = await requireAdminUser()
  const parsed = couponSchema.safeParse({
    propertySlug: formData.get("propertySlug"),
    propertySlugs: formData.getAll("propertySlugs"),
    code: formData.get("code"),
    internalName: formData.get("internalName") || undefined,
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    validFrom: formData.get("validFrom"),
    expiresOn: formData.get("expiresOn"),
    minimumNights: formData.get("minimumNights"),
    minimumSubtotal: formData.get("minimumSubtotal"),
    maxRedemptions: formData.get("maxRedemptions"),
    maxRedemptionsPerGuest: formData.get("maxRedemptionsPerGuest"),
  })
  const propertySlug = typeof formData.get("propertySlug") === "string" ? String(formData.get("propertySlug")) : ""
  if (!parsed.success) redirect(`/admin/properties/${encodeURIComponent(propertySlug)}?error=invalid-coupon#create-coupon`)

  const catalog = await getCatalog()
  const selectedSlugs = [...new Set(parsed.data.propertySlugs)]
  const property = catalog.find((item) => item.slug === parsed.data.propertySlug)
  const validSlugs = new Set(catalog.map((item) => item.slug))
  if (!property || !selectedSlugs.includes(property.slug) || selectedSlugs.some((slug) => !validSlugs.has(slug))) {
    redirect("/admin/properties?error=property-not-found")
  }

  try {
    await createPropertyCoupon({
      propertySlugs: [property.slug, ...selectedSlugs.filter((slug) => slug !== property.slug)],
      code: parsed.data.code,
      internalName: parsed.data.internalName,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      startsAt: new Date(`${parsed.data.validFrom}T00:00:00.000Z`),
      expiresAt: parsed.data.expiresOn ? new Date(`${parsed.data.expiresOn}T23:59:59.999Z`) : null,
      minimumNights: parsed.data.minimumNights,
      minimumSubtotal: parsed.data.minimumSubtotal,
      maxRedemptions: parsed.data.maxRedemptions,
      maxRedemptionsPerGuest: parsed.data.maxRedemptionsPerGuest,
      createdBy: viewer.id,
    })
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
    if (code === "23505") redirect(`/admin/properties/${property.slug}?error=duplicate-code#create-coupon`)
    console.error("Unable to create coupon", error)
    redirect(`/admin/properties/${property.slug}?error=create-failed#create-coupon`)
  }

  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/properties")
  for (const slug of selectedSlugs) revalidatePath(`/admin/properties/${slug}`)
  redirect(`/admin/properties/${property.slug}?notice=coupon-created#coupons`)
}

export async function toggleCouponAction(formData: FormData) {
  await requireAdminUser()
  const parsed = couponToggleSchema.safeParse({
    couponId: formData.get("couponId"),
    propertySlug: formData.get("propertySlug"),
    isActive: formData.get("isActive"),
  })
  if (!parsed.success) redirect("/admin/properties?error=invalid-coupon")

  const updated = await setPropertyCouponActive({
    id: parsed.data.couponId,
    propertySlug: parsed.data.propertySlug,
    isActive: parsed.data.isActive,
  })
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/properties")
  revalidatePath(`/admin/properties/${parsed.data.propertySlug}`)
  redirect(`/admin/properties/${parsed.data.propertySlug}?${updated ? "notice=coupon-updated" : "error=coupon-not-found"}#coupons`)
}

export async function saveCouponAdvertisingAction(formData: FormData) {
  await requireAdminUser()
  const parsed = couponAdvertisingSchema.safeParse({
    couponId: formData.get("couponId"),
    propertySlug: formData.get("propertySlug"),
    pagePaths: formData.getAll("pagePaths"),
  })
  if (!parsed.success) redirect("/admin/properties?error=invalid-coupon")

  const catalog = await getCatalog()
  const validPaths = getCouponPromotionPagePaths(catalog)
  const selectedPaths = [...new Set(parsed.data.pagePaths.map(normalizeCouponPromotionPath))]
  if (selectedPaths.some((path) => !path || !validPaths.has(path))) {
    redirect(`/admin/coupons/${parsed.data.couponId}/advertising?from=${encodeURIComponent(parsed.data.propertySlug)}&error=invalid-pages`)
  }

  const saved = await saveCouponPagePromotions({
    couponId: parsed.data.couponId,
    pagePaths: selectedPaths as string[],
  })
  if (!saved) redirect(`/admin/properties/${encodeURIComponent(parsed.data.propertySlug)}?error=coupon-not-found#coupons`)

  revalidatePath(`/admin/coupons/${parsed.data.couponId}/advertising`)
  revalidatePath(`/admin/properties/${parsed.data.propertySlug}`)
  for (const path of selectedPaths) revalidatePath(path as string)
  redirect(`/admin/coupons/${parsed.data.couponId}/advertising?from=${encodeURIComponent(parsed.data.propertySlug)}&notice=saved`)
}
