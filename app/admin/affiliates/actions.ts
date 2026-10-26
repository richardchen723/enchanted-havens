"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireAdminUser } from "@/lib/admin-auth"
import { affiliateSchema, commissionStatusSchema } from "@/lib/affiliate-rules"
import { saveAffiliate, updateCommission } from "@/lib/affiliates"

export async function saveAffiliateAction(form: FormData) {
  const viewer = await requireAdminUser()
  const id = form.get("id") ? z.string().uuid().safeParse(form.get("id")) : null
  if (id && !id.success) redirect("/admin/affiliates?error=invalid")
  const parsed = affiliateSchema.safeParse({
    ...Object.fromEntries(form), startsOn: form.get("startsOn") || null, endsOn: form.get("endsOn") || null,
  })
  const destination = id?.success ? `/admin/affiliates/${id.data}` : "/admin/affiliates"
  if (!parsed.success) redirect(`${destination}?error=invalid#affiliate-form`)
  let savedId: string
  try {
    savedId = await saveAffiliate(parsed.data, viewer.id, id?.success ? id.data : undefined)
  } catch (error) {
    const duplicate = typeof error === "object" && error && "code" in error && error.code === "23505"
    console.error("Affiliate save failed", error)
    redirect(`${destination}?error=${duplicate ? "duplicate" : "save-failed"}#affiliate-form`)
  }
  revalidatePath("/admin/affiliates", "layout")
  redirect(`/admin/affiliates/${savedId}?saved=1`)
}

export async function updateCommissionAction(form: FormData) {
  const viewer = await requireAdminUser()
  const parsed = z.object({
    id: z.string().uuid(), status: commissionStatusSchema,
    amount: z.coerce.number().finite().min(0).max(1000000).multipleOf(0.01),
    notes: z.string().trim().min(3).max(2000),
  }).safeParse(Object.fromEntries(form))
  if (!parsed.success) redirect("/admin/affiliates?error=invalid-commission#commissions")
  try {
    await updateCommission({ ...parsed.data, actorId: viewer.id })
  } catch (error) {
    console.error("Commission update failed", error)
    redirect("/admin/affiliates?error=save-failed#commissions")
  }
  revalidatePath("/admin/affiliates", "layout")
  redirect("/admin/affiliates?saved=1#commissions")
}
