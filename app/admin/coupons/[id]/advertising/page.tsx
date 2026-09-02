import { format } from "date-fns"
import { ArrowLeft, Building2, CheckCircle2, Megaphone, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import { CouponAdvertisingForm } from "@/components/admin/coupon-advertising-form"
import { requireAdminUser } from "@/lib/admin-auth"
import { getCatalog } from "@/lib/catalog"
import { buildCouponPromotionPageGroups } from "@/lib/coupon-promotion-pages"
import { getCouponAdvertisingSettings, getCouponOfferLabel } from "@/lib/coupons"

export const dynamic = "force-dynamic"

export default async function CouponAdvertisingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const viewer = await requireAdminUser()
  const [{ id }, query, catalog] = await Promise.all([params, searchParams, getCatalog()])
  const settings = await getCouponAdvertisingSettings(id)
  if (!settings.coupon) notFound()

  const coupon = settings.coupon
  const requestedFrom = typeof query.from === "string" ? query.from : ""
  const propertySlug = coupon.propertySlugs.includes(requestedFrom) ? requestedFrom : coupon.propertySlug
  const propertyNames = new Map(catalog.map((property) => [property.slug, property.displayName]))
  const groups = buildCouponPromotionPageGroups(catalog)
  const saved = query.notice === "saved"
  const invalidPages = query.error === "invalid-pages"

  return (
    <AdminShell viewer={viewer} active="properties">
      <Link href={`/admin/properties/${propertySlug}#coupons`} className="inline-flex min-h-10 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#173c33]"><ArrowLeft className="size-4" />Back to {propertyNames.get(propertySlug) || "property"}</Link>
      {saved ? <div role="status" className="mt-4 flex items-center gap-3 rounded-xl border border-[#63806a]/22 bg-[#e7efe8] p-4 text-sm text-[#36533e]"><CheckCircle2 className="size-4" />Advertising pages saved. The featured offer will appear only while this coupon is valid and available.</div> : null}
      {invalidPages ? <div role="alert" className="mt-4 rounded-xl border border-red-900/15 bg-red-50 p-4 text-sm text-red-900">One or more pages are no longer available. Review the selection and save again.</div> : null}

      <section className="mt-5 overflow-hidden rounded-xl bg-[#173c33] p-7 text-white shadow-[0_18px_55px_rgba(23,60,51,.16)] sm:p-9">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#d5b578]"><Megaphone className="size-4" /><p className="text-[0.62rem] font-bold uppercase tracking-[0.18em]">Coupon advertising</p></div>
            <h1 className="mt-4 font-display text-5xl leading-none">Feature {coupon.code}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">Choose the public pages where guests should discover this offer. The placement is prominent but restrained: a slim branded row attached to the navigation, never a popup.</p>
          </div>
          <div className="min-w-64 rounded-lg border border-white/12 bg-white/[.05] p-5">
            <p className="font-display text-2xl">{getCouponOfferLabel(coupon)}</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-white/55"><Building2 className="size-3.5 text-[#d5b578]" />{coupon.propertySlugs.length} eligible {coupon.propertySlugs.length === 1 ? "property" : "properties"}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-white/55"><ShieldCheck className="size-3.5 text-[#d5b578]" />{coupon.expiresAt ? `Expires ${format(new Date(coupon.expiresAt), "MMM d, yyyy")}` : "No expiration date"}</p>
          </div>
        </div>
      </section>

      <CouponAdvertisingForm coupon={coupon} groups={groups} initialPagePaths={settings.pagePaths} placements={settings.placements} propertySlug={propertySlug} />
    </AdminShell>
  )
}
