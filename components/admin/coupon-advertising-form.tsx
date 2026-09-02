"use client"

import { Check, Eye, Megaphone, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"
import { saveCouponAdvertisingAction } from "@/app/admin/actions"
import { AdminSubmitButton } from "@/components/admin/admin-submit-button"
import type { CouponPromotionPageGroup } from "@/lib/coupon-promotion-pages"
import type { CouponPagePlacement, PropertyCoupon } from "@/lib/coupons"

function offerLabel(coupon: Pick<PropertyCoupon, "discountType" | "discountValue">) {
  return coupon.discountType === "percentage"
    ? `${coupon.discountValue}% off accommodation`
    : `$${coupon.discountValue.toFixed(2)} off accommodation`
}

export function CouponAdvertisingForm({
  coupon,
  groups,
  initialPagePaths,
  placements,
  propertySlug,
}: {
  coupon: PropertyCoupon
  groups: CouponPromotionPageGroup[]
  initialPagePaths: string[]
  placements: CouponPagePlacement[]
  propertySlug: string
}) {
  const [selected, setSelected] = useState(() => new Set(initialPagePaths))
  const occupiedByOtherCoupon = useMemo(() => new Map(
    placements
      .filter((placement) => placement.couponId !== coupon.id)
      .map((placement) => [placement.pagePath, placement.couponCode]),
  ), [coupon.id, placements])

  function togglePath(path: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function toggleGroup(group: CouponPromotionPageGroup) {
    const allSelected = group.pages.every((page) => selected.has(page.path))
    setSelected((current) => {
      const next = new Set(current)
      for (const page of group.pages) {
        if (allSelected) next.delete(page.path)
        else next.add(page.path)
      }
      return next
    })
  }

  return (
    <form action={saveCouponAdvertisingAction} className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
      <input type="hidden" name="couponId" value={coupon.id} />
      <input type="hidden" name="propertySlug" value={propertySlug} />
      <div className="grid gap-5">
        {groups.map((group) => {
          const selectedCount = group.pages.filter((page) => selected.has(page.path)).length
          const allSelected = selectedCount === group.pages.length
          return (
            <section key={group.id} className="overflow-hidden rounded-xl border border-black/8 bg-[#fbf9f4] shadow-[0_14px_45px_rgba(23,60,51,.04)]">
              <div className="flex flex-col gap-4 border-b border-black/8 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl text-[#173c33]">{group.label}</h2>
                    <span className="rounded-full bg-[#173c33]/8 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-[#173c33]">{selectedCount}/{group.pages.length}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-black/44">{group.description}</p>
                </div>
                <button type="button" onClick={() => toggleGroup(group)} className="min-h-10 shrink-0 rounded-lg border border-black/10 bg-white px-4 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#173c33] transition hover:border-[#173c33]/35">
                  {allSelected ? "Clear section" : "Select section"}
                </button>
              </div>
              <div className="grid gap-px bg-black/7 sm:grid-cols-2">
                {group.pages.map((page) => {
                  const checked = selected.has(page.path)
                  const conflictCode = occupiedByOtherCoupon.get(page.path)
                  return (
                    <label key={page.path} className={`relative flex min-h-28 cursor-pointer gap-4 bg-white p-5 transition ${checked ? "bg-[#edf2ea]" : "hover:bg-[#faf8f3]"}`}>
                      <input
                        type="checkbox"
                        name="pagePaths"
                        value={page.path}
                        checked={checked}
                        onChange={() => togglePath(page.path)}
                        className="peer sr-only"
                      />
                      <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition ${checked ? "border-[#173c33] bg-[#173c33] text-white" : "border-black/20 bg-white text-transparent"}`}><Check className="size-3" /></span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-5 text-[#173c33]">{page.label}</span>
                        <span className="mt-1 block truncate font-mono text-[0.62rem] text-black/34">{page.path}</span>
                        <span className="mt-2 block text-xs leading-5 text-black/43">{page.description}</span>
                        {conflictCode ? <span className="mt-2 block text-[0.62rem] font-semibold text-[#8a5c23]">Currently features {conflictCode}; saving will replace it.</span> : null}
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <aside className="xl:sticky xl:top-28">
        <div className="rounded-xl bg-[#0b2922] p-6 text-white shadow-[0_20px_55px_rgba(7,30,25,.18)]">
          <div className="flex items-center gap-2 text-[#e0c28f]"><Eye className="size-4" /><p className="text-[0.62rem] font-bold uppercase tracking-[0.16em]">Guest preview</p></div>
          <div className="mt-5 overflow-hidden rounded-lg border border-white/14 bg-[#f8f4ea] text-[#173c33]">
            <div className="flex min-h-10 items-center justify-between px-4"><p className="font-display text-sm">Enchanted Havens</p><span className="text-[0.45rem] font-bold uppercase tracking-[0.14em] text-black/38">Havens · Story · Contact</span></div>
            <div className="border-y border-[#d5b578]/30 bg-[#15382f] px-4 py-3 text-white">
              <div className="flex items-center gap-2 text-[#e0c28f]"><Sparkles className="size-3" /><p className="text-[0.5rem] font-bold uppercase tracking-[0.15em]">Private offer</p></div>
              <div className="mt-2 flex items-end justify-between gap-3"><p className="font-display text-xl leading-none">{offerLabel(coupon)}</p><div className="shrink-0 rounded border border-white/20 bg-white/8 px-2 py-1.5 font-mono text-[0.62rem] font-bold tracking-[0.1em]">{coupon.code}</div></div>
            </div>
            <div className="h-14 bg-[linear-gradient(135deg,#d7ddd5,#f0e8da)]" aria-hidden="true" />
          </div>
          <p className="mt-4 text-xs leading-5 text-white/52">The offer stays attached directly beneath the navigation as guests scroll.</p>
          <div className="mt-5 flex items-center gap-3 border-t border-white/12 pt-5"><Megaphone className="size-4 text-[#e0c28f]" /><p className="text-sm"><strong>{selected.size}</strong> {selected.size === 1 ? "page" : "pages"} selected</p></div>
          <p className="mt-4 text-xs leading-5 text-white/48">Each page can feature one offer. Inactive, upcoming, expired, or fully redeemed coupons stay hidden automatically.</p>
          <AdminSubmitButton className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f2e7d2] px-5 text-xs font-bold uppercase tracking-[0.11em] text-[#173c33] disabled:opacity-60">Save advertising</AdminSubmitButton>
        </div>
      </aside>
    </form>
  )
}
