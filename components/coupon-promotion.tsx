"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { trackConversionEvent } from "@/lib/analytics"
import type { PublicCouponPromotion } from "@/lib/coupons"

export function CouponPromotion({ pathname }: { pathname: string }) {
  const [loaded, setLoaded] = useState<{ pathname: string; promotion: PublicCouponPromotion | null }>({ pathname: "", promotion: null })

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/coupon-promotions?path=${encodeURIComponent(pathname)}`, { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : { promotion: null })
      .then((data: { promotion?: PublicCouponPromotion | null }) => setLoaded({ pathname, promotion: data.promotion || null }))
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setLoaded({ pathname, promotion: null })
      })
    return () => controller.abort()
  }, [pathname])

  const promotion = loaded.pathname === pathname ? loaded.promotion : null
  if (!promotion) return null

  return (
    <aside aria-label={`Private offer: ${promotion.offerLabel}`} className="absolute inset-x-0 top-full border-y border-[#d5b578]/25 bg-[#102f28]/98 text-white shadow-[0_12px_32px_rgba(7,30,25,.16)] backdrop-blur-xl">
      <div className="container-shell flex min-h-[4.15rem] items-center gap-3 py-2.5 sm:gap-5 lg:min-h-[3.7rem] lg:py-0">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#d5b578]/35 text-[#e7c892]"><Sparkles aria-hidden="true" className="size-3.5" /></span>
        <div className="min-w-0 flex-1 lg:flex lg:items-baseline lg:gap-3">
          <p className="truncate text-[0.52rem] font-bold uppercase tracking-[0.18em] text-[#e7c892]">Private offer</p>
          <p className="mt-0.5 truncate font-display text-[1.15rem] leading-none text-[#fffaf0] sm:text-xl lg:mt-0">{promotion.offerLabel}</p>
        </div>
        <span className="shrink-0 rounded-sm border border-white/18 bg-white/[.07] px-2.5 py-2 font-mono text-[0.64rem] font-bold tracking-[0.13em] sm:px-3" aria-label={`Coupon code ${promotion.code}`}>{promotion.code}</span>
        <p className="hidden max-w-64 border-l border-white/14 pl-5 text-[0.62rem] leading-5 text-white/52 xl:block">{promotion.termsLabel}</p>
        <Link
          href={promotion.ctaHref}
          onClick={() => trackConversionEvent("Coupon Promotion Clicked", { placement: pathname, property: promotion.propertySlugs.length === 1 ? promotion.propertySlugs[0] : "multiple" })}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 border-l border-white/14 pl-3 text-[0.57rem] font-bold uppercase tracking-[0.12em] text-[#f2e7d2] transition hover:text-white sm:pl-5"
        >
          <span className="hidden md:inline">{promotion.ctaLabel}</span><span className="sr-only md:hidden">Explore offer</span><ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </aside>
  )
}
