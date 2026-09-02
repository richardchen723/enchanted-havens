import { format } from "date-fns"
import { ArrowLeft, ArrowUpRight, Building2, CalendarDays, CheckCircle2, Clock3, Megaphone, Percent, Plus, Tag, TicketCheck, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createCouponAction, toggleCouponAction } from "@/app/admin/actions"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminSubmitButton } from "@/components/admin/admin-submit-button"
import { requireAdminUser } from "@/lib/admin-auth"
import { getCatalog } from "@/lib/catalog"
import { listPropertyCoupons, type PropertyCoupon } from "@/lib/coupons"

export const dynamic = "force-dynamic"

const notices: Record<string, string> = {
  "coupon-created": "Coupon created for the selected properties. Guests can use it as soon as its valid-from date begins.",
  "coupon-updated": "Coupon availability updated.",
}

const errors: Record<string, string> = {
  "invalid-coupon": "Review the coupon fields. Percentages must be 100 or less, and every limit must be a positive number.",
  "duplicate-code": "That code already exists for one or more selected properties. Choose a different code or reactivate the existing coupon.",
  "create-failed": "The coupon could not be created. Please try again.",
  "coupon-not-found": "That coupon could not be found.",
}

function couponStatus(coupon: PropertyCoupon) {
  const now = Date.now()
  if (!coupon.isActive) return { label: "Paused", className: "bg-black/6 text-black/45" }
  if (new Date(coupon.startsAt).getTime() > now) return { label: "Scheduled", className: "bg-[#eee2cf] text-[#805a27]" }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) return { label: "Expired", className: "bg-[#f4e6e1] text-[#8b4032]" }
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) return { label: "Limit reached", className: "bg-[#f4e6e1] text-[#8b4032]" }
  return { label: "Active", className: "bg-[#e7efe8] text-[#43634b]" }
}

function offerLabel(coupon: PropertyCoupon) {
  return coupon.discountType === "percentage" ? `${coupon.discountValue}% off accommodation` : `$${coupon.discountValue.toFixed(2)} off accommodation`
}

function rules(coupon: PropertyCoupon) {
  const items = []
  if (coupon.minimumNights) items.push(`${coupon.minimumNights}+ nights`)
  if (coupon.minimumSubtotal) items.push(`$${coupon.minimumSubtotal.toFixed(2)} minimum`)
  if (coupon.maxRedemptions) items.push(`${coupon.redemptionCount}/${coupon.maxRedemptions} total uses`)
  else items.push(`${coupon.redemptionCount} ${coupon.redemptionCount === 1 ? "use" : "uses"}`)
  if (coupon.maxRedemptionsPerGuest) items.push(`${coupon.maxRedemptionsPerGuest} per guest email`)
  return items
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-black/52">{label}</span>{children}{hint ? <span className="mt-2 block text-[0.68rem] leading-5 text-black/38">{hint}</span> : null}</label>
}

export default async function AdminPropertyPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requireAdminUser()
  const { slug } = await params
  const [catalog, coupons, query] = await Promise.all([getCatalog(), listPropertyCoupons(slug), searchParams])
  const property = catalog.find((item) => item.slug === slug)
  if (!property) notFound()
  const propertyNames = new Map(catalog.map((item) => [item.slug, item.displayName]))
  const notice = typeof query.notice === "string" ? notices[query.notice] : null
  const error = typeof query.error === "string" ? errors[query.error] : null
  const today = new Date().toISOString().slice(0, 10)

  return (
    <AdminShell viewer={viewer} active="properties">
      <Link href="/admin/properties" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#173c33]"><ArrowLeft className="size-4" />All properties</Link>
      {notice ? <div role="status" className="mt-4 flex items-center gap-3 rounded-xl border border-[#63806a]/22 bg-[#e7efe8] p-4 text-sm text-[#36533e]"><CheckCircle2 className="size-4" />{notice}</div> : null}
      {error ? <div role="alert" className="mt-4 rounded-xl border border-red-900/15 bg-red-50 p-4 text-sm text-red-900">{error}</div> : null}

      <section className="mt-5 overflow-hidden rounded-xl bg-[#173c33] text-white shadow-[0_18px_55px_rgba(23,60,51,.16)]">
        <div className="grid lg:grid-cols-[.78fr_1fr]">
          <div className="relative min-h-64"><Image src={property.heroImage} alt="" fill priority sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#173c33]/30" /></div>
          <div className="flex flex-col justify-center p-7 sm:p-9"><p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#d5b578]">Property workspace</p><h1 className="mt-3 font-display text-5xl leading-none">{property.displayName}</h1><p className="mt-4 max-w-xl text-sm leading-7 text-white/58">{property.narrative}</p><div className="mt-6 flex flex-wrap gap-4 text-[0.65rem] font-bold uppercase tracking-[0.11em] text-white/55"><span className="flex items-center gap-2"><Users className="size-3.5 text-[#d5b578]" />Up to {Math.max(...property.variants.map((variant) => variant.guests))} guests</span><span className="flex items-center gap-2"><Tag className="size-3.5 text-[#d5b578]" />{property.variants.length} bookable {property.variants.length === 1 ? "option" : "options"}</span></div><Link href={`/havens/${property.slug}`} className="mt-6 inline-flex w-fit min-h-10 items-center gap-2 rounded-lg border border-white/16 px-4 text-xs font-semibold text-white/72 transition hover:bg-white/5 hover:text-white">View guest page <ArrowUpRight className="size-3.5" /></Link></div>
        </div>
      </section>

      <section id="create-coupon" className="mt-7 scroll-mt-40 rounded-xl border border-black/8 bg-[#fbf9f4] shadow-[0_14px_45px_rgba(23,60,51,.045)]">
        <div className="border-b border-black/8 px-6 py-5"><p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#97723c]">Guest offer</p><h2 className="mt-2 font-display text-3xl text-[#173c33]">Create a custom coupon</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-black/48">Create one code for this haven or select additional properties below. The same validity and usage limits are shared across every selected property.</p></div>
        <form action={createCouponAction} className="p-6">
          <input type="hidden" name="propertySlug" value={property.slug} />
          <input type="hidden" name="propertySlugs" value={property.slug} />
          <div>
            <div className="flex items-center gap-2"><Building2 className="size-4 text-[#805a27]" /><h3 className="text-sm font-semibold text-[#173c33]">Where can guests use this coupon?</h3></div>
            <p className="mt-2 text-xs leading-5 text-black/42">{property.displayName} is included automatically. Select any additional properties that should accept the same code.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="flex min-h-14 items-center gap-3 rounded-lg border border-[#63806a]/25 bg-[#e7efe8] px-4 text-sm font-semibold text-[#173c33]"><input type="checkbox" checked readOnly className="size-4 accent-[#173c33]" />{property.displayName}<span className="ml-auto text-[0.58rem] uppercase tracking-[0.1em] text-[#43634b]">Included</span></label>
              {catalog.filter((item) => item.slug !== property.slug).map((item) => <label key={item.slug} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-black/10 bg-white px-4 text-sm text-black/58 transition hover:border-[#805a27]/35"><input type="checkbox" name="propertySlugs" value={item.slug} className="size-4 accent-[#173c33]" />{item.displayName}</label>)}
            </div>
          </div>
          <div className="mt-7 border-t border-black/8 pt-6"><div className="flex items-center gap-2"><Tag className="size-4 text-[#805a27]" /><h3 className="text-sm font-semibold text-[#173c33]">Code and discount</h3></div></div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Coupon code" hint="Guests enter this code. Not case-sensitive."><input name="code" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_-]+" className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4 font-mono uppercase tracking-[0.08em]" placeholder="AUTUMN15" /></Field>
            <Field label="Campaign name" hint="Optional internal label."><input name="internalName" maxLength={160} className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" placeholder="Returning guests" /></Field>
            <Field label="Discount type"><select name="discountType" defaultValue="percentage" className="min-h-12 w-full appearance-none rounded-lg border border-black/12 bg-white px-4"><option value="percentage">Percentage</option><option value="fixed">Fixed amount (USD)</option></select></Field>
            <Field label="Discount value" hint="Enter 15 for 15% or $15."><input name="discountValue" required type="number" inputMode="decimal" min="0.01" max="10000" step="0.01" className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" placeholder="15" /></Field>
          </div>

          <div className="mt-7 border-t border-black/8 pt-6"><div className="flex items-center gap-2"><CalendarDays className="size-4 text-[#805a27]" /><h3 className="text-sm font-semibold text-[#173c33]">Validity and limits</h3></div><p className="mt-2 text-xs leading-5 text-black/42">Leave optional limits blank for no restriction. Validity controls when the code can be applied, not the guest’s stay dates.</p></div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Valid from"><input name="validFrom" required type="date" defaultValue={today} className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" /></Field>
            <Field label="Expires on" hint="Valid through 11:59pm UTC."><input name="expiresOn" type="date" min={today} className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" /></Field>
            <Field label="Minimum nights"><input name="minimumNights" type="number" inputMode="numeric" min="1" step="1" className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" placeholder="No minimum" /></Field>
            <Field label="Minimum accommodation"><input name="minimumSubtotal" type="number" inputMode="decimal" min="0.01" step="0.01" className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" placeholder="No minimum" /></Field>
            <Field label="Total redemption limit"><input name="maxRedemptions" type="number" inputMode="numeric" min="1" step="1" className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" placeholder="Unlimited" /></Field>
            <Field label="Uses per guest email" hint="Recommended: one per guest."><input name="maxRedemptionsPerGuest" type="number" inputMode="numeric" min="1" step="1" defaultValue="1" className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" /></Field>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-black/8 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-5 text-black/42">Fixed discounts are capped at the accommodation subtotal, so a coupon can never create a negative reservation total.</p><AdminSubmitButton className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#173c33] px-6 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60"><Plus className="size-4" />Create coupon</AdminSubmitButton></div>
        </form>
      </section>

      <section id="coupons" className="mt-7 scroll-mt-40">
        <div className="flex items-end justify-between gap-4"><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#97723c]">Offer library</p><h2 className="mt-2 font-display text-3xl text-[#173c33]">Coupons available at {property.displayName}</h2></div><span className="rounded-full bg-[#173c33]/8 px-3 py-1 text-xs font-semibold text-[#173c33]">{coupons.length} total</span></div>
        {coupons.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{coupons.map((coupon) => {
          const status = couponStatus(coupon)
          return <article key={coupon.id} className="rounded-xl border border-black/8 bg-[#fbf9f4] p-6 shadow-[0_14px_45px_rgba(23,60,51,.04)]"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-lg font-bold tracking-[0.08em] text-[#173c33]">{coupon.code}</p><span className={`rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] ${status.className}`}>{status.label}</span></div>{coupon.internalName ? <p className="mt-1 text-xs text-black/40">{coupon.internalName}</p> : null}<p className="mt-4 font-display text-2xl text-[#173c33]">{offerLabel(coupon)}</p></div><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#eee5d6] text-[#805a27]"><Percent className="size-4" /></span></div><div className="mt-5"><p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-black/35">Accepted at {coupon.propertySlugs.length} {coupon.propertySlugs.length === 1 ? "property" : "properties"}</p><div className="mt-2 flex flex-wrap gap-2">{coupon.propertySlugs.map((propertySlug) => <span key={propertySlug} className="rounded-full bg-[#e7efe8] px-2.5 py-1 text-[0.62rem] font-semibold text-[#43634b]">{propertyNames.get(propertySlug) || propertySlug.replaceAll("-", " ")}</span>)}</div></div><div className="mt-5 flex flex-wrap gap-2">{rules(coupon).map((rule) => <span key={rule} className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[0.62rem] text-black/48">{rule}</span>)}</div><div className="mt-5 border-t border-black/8 pt-4 text-xs leading-5 text-black/42"><p className="flex items-center gap-2"><Clock3 className="size-3.5 text-[#805a27]" />Starts {format(new Date(coupon.startsAt), "MMM d, yyyy")}{coupon.expiresAt ? ` · Expires ${format(new Date(coupon.expiresAt), "MMM d, yyyy")}` : " · No expiration"}</p></div><div className="mt-5 flex flex-wrap gap-3"><Link href={`/admin/coupons/${coupon.id}/advertising?from=${property.slug}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#173c33] px-4 text-xs font-bold uppercase tracking-[0.1em] text-white"><Megaphone className="size-3.5" />Advertise</Link><form action={toggleCouponAction}><input type="hidden" name="couponId" value={coupon.id} /><input type="hidden" name="propertySlug" value={property.slug} /><input type="hidden" name="isActive" value={coupon.isActive ? "false" : "true"} /><AdminSubmitButton className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold uppercase tracking-[0.1em] disabled:opacity-60 ${coupon.isActive ? "border border-black/10 bg-white text-black/55" : "bg-[#173c33] text-white"}`}>{coupon.isActive ? "Pause everywhere" : "Reactivate everywhere"}</AdminSubmitButton></form></div></article>
        })}</div> : <div className="mt-5 rounded-xl border border-dashed border-black/14 bg-[#fbf9f4] px-6 py-12 text-center"><TicketCheck className="mx-auto size-6 text-[#805a27]" /><p className="mt-4 font-display text-2xl text-[#173c33]">No coupons for this property yet.</p><p className="mt-2 text-sm text-black/44">Create the first offer above. It will appear here with its rules and usage count.</p></div>}
      </section>
    </AdminShell>
  )
}
