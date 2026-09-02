import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MapPin, Percent, Users } from "lucide-react"
import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdminUser } from "@/lib/admin-auth"
import { getCatalog } from "@/lib/catalog"
import { getCouponCountsByProperty } from "@/lib/coupons"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Properties · Admin" }

export default async function AdminPropertiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requireAdminUser()
  const [catalog, couponCounts, query] = await Promise.all([getCatalog(), getCouponCountsByProperty(), searchParams])
  const error = query.error === "property-not-found" ? "That property could not be found." : null

  return (
    <AdminShell viewer={viewer} active="properties">
      {error ? <div role="alert" className="mb-6 rounded-xl border border-red-900/15 bg-red-50 p-4 text-sm text-red-900">{error}</div> : null}
      <section className="border-b border-black/10 pb-8">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#97723c]">Property workspace</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-[#173c33] sm:text-6xl">Your havens</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-black/52">Open a property to manage its guest offers. One coupon can be shared across several properties, while every existing single-property coupon keeps working as before.</p>
      </section>

      <section aria-label="Properties" className="grid gap-5 py-7 md:grid-cols-2 xl:grid-cols-3">
        {catalog.sort((a, b) => a.featuredOrder - b.featuredOrder).map((property) => {
          const counts = couponCounts.get(property.slug) || { active: 0, total: 0 }
          const maxGuests = Math.max(...property.variants.map((variant) => variant.guests))
          return (
            <Link key={property.slug} href={`/admin/properties/${property.slug}`} className="group overflow-hidden rounded-xl border border-black/8 bg-[#fbf9f4] shadow-[0_14px_45px_rgba(23,60,51,.045)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(23,60,51,.09)]">
              <div className="relative h-48 overflow-hidden bg-[#173c33]/8"><Image src={property.heroImage} alt="" fill sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" /><div className="absolute inset-0 bg-gradient-to-t from-[#071e19]/55 to-transparent" /><span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-[#071e19]/55 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white backdrop-blur">{property.estate ? `${property.variants.length} bookable options` : "Individual haven"}</span></div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-3xl text-[#173c33]">{property.displayName}</h2><p className="mt-2 flex items-center gap-2 text-xs text-black/44"><MapPin className="size-3.5 text-[#805a27]" />{property.location}</p></div><ArrowRight className="mt-1 size-4 text-[#805a27] transition group-hover:translate-x-1" /></div>
                <div className="mt-5 grid grid-cols-3 divide-x divide-black/8 border-t border-black/8 pt-4 text-center"><div><p className="text-lg font-semibold text-[#173c33]">{counts.active}</p><p className="mt-1 text-[0.58rem] uppercase tracking-[0.1em] text-black/38">Active</p></div><div><p className="text-lg font-semibold text-[#173c33]">{counts.total}</p><p className="mt-1 text-[0.58rem] uppercase tracking-[0.1em] text-black/38">Coupons</p></div><div><p className="flex items-center justify-center gap-1 text-lg font-semibold text-[#173c33]"><Users className="size-3.5" />{maxGuests}</p><p className="mt-1 text-[0.58rem] uppercase tracking-[0.1em] text-black/38">Guests</p></div></div>
              </div>
            </Link>
          )
        })}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-[#805a27]/18 bg-[#eee5d6] p-5 text-sm leading-6 text-black/55"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/65 text-[#805a27]"><Percent className="size-4" /></span><div><p className="font-semibold text-[#173c33]">Coupons can cover one or many properties.</p><p className="mt-1">A shared coupon uses the same code, dates, discount, and limits everywhere it is accepted. The total and per-guest usage limits are shared across all selected properties.</p></div></div>
    </AdminShell>
  )
}
