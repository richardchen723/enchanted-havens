"use client"

import Link from "next/link"
import { ArrowRight, LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { trackConversionEvent } from "@/lib/analytics"
import { DateRangePicker } from "@/components/date-range-picker"
import { GuestCountControl } from "@/components/guest-count-control"
import { useTextInquiry } from "@/components/text-inquiry/text-inquiry-provider"
import { buildInquiryHref } from "@/lib/contact-handoff"
import type { Property, PropertyVariant, Quote } from "@/lib/schemas"
import type { StaySelection } from "@/lib/stay-search"
import { formatCurrency } from "@/lib/utils"

type BookingPanelProps = {
  property: Pick<Property, "slug">
  variant: Pick<PropertyVariant, "id" | "slug" | "guests">
  bookingLive: boolean
  quoteAvailable: boolean
  initialSelection?: StaySelection
  preservedQuery?: string
  returnTo?: string
}

type QuoteSource = "hostaway" | "sandbox"

export function BookingPanel({ property, variant, bookingLive, quoteAvailable, initialSelection, preservedQuery = "", returnTo }: BookingPanelProps) {
  const { chatEnabled, openTextInquiry, setLauncherSuppressed } = useTextInquiry()
  const [checkIn, setCheckIn] = useState(initialSelection?.checkIn || "")
  const [checkOut, setCheckOut] = useState(initialSelection?.checkOut || "")
  const [guests, setGuests] = useState(Math.min(initialSelection?.guests || 2, variant.guests))
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteSource, setQuoteSource] = useState<QuoteSource | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const hasDates = Boolean(checkIn && checkOut)
  const availabilityError = hasDates && !quoteAvailable
    ? "Live pricing is temporarily unavailable. Send an inquiry and our stay team will confirm the stay for you."
    : ""

  useEffect(() => {
    if (!hasDates || !quoteAvailable) return

    const controller = new AbortController()
    async function loadQuote() {
      setLoading(true)
      try {
        const response = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: variant.id, checkIn, checkOut, guests }),
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Unable to calculate this stay.")
        setQuote(data.quote)
        setQuoteSource(data.source === "sandbox" ? "sandbox" : "hostaway")
        trackConversionEvent("Stay Quote Viewed", { property: property.slug, nights: data.quote.nights, guests })
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return
        setError(requestError instanceof Error ? requestError.message : "Unable to calculate this stay.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadQuote()

    return () => controller.abort()
  }, [checkIn, checkOut, guests, hasDates, property.slug, quoteAvailable, variant.id])

  const inquiryHref = useMemo(() => {
    return buildInquiryHref({
      property: property.slug,
      variant: variant.slug,
      checkIn,
      checkOut,
      guests,
      preservedQuery,
      returnTo,
    })
  }, [checkIn, checkOut, guests, preservedQuery, property.slug, returnTo, variant.slug])

  const bookingHref = useMemo(() => {
    const params = new URLSearchParams(preservedQuery)
    params.set("variant", variant.slug)
    params.set("checkIn", checkIn)
    params.set("checkOut", checkOut)
    params.set("guests", String(guests))
    return `/booking/${property.slug}?${params.toString()}`
  }, [checkIn, checkOut, guests, preservedQuery, property.slug, variant.slug])

  const canBook = Boolean(quote?.available && bookingLive)
  const calendarSuppressionKey = `booking-calendar:${variant.slug}`
  const handleCalendarOpenChange = useCallback((calendarOpen: boolean) => {
    setLauncherSuppressed(calendarSuppressionKey, calendarOpen)
  }, [calendarSuppressionKey, setLauncherSuppressed])

  useEffect(() => () => setLauncherSuppressed(calendarSuppressionKey, false), [calendarSuppressionKey, setLauncherSuppressed])

  return (
    <aside id="reserve" className="order-first h-fit self-start scroll-mt-28 border border-black/10 bg-[#fffdf8] p-6 shadow-[0_24px_70px_rgba(7,30,25,.08)] lg:order-none lg:col-start-2 lg:row-start-1 lg:sticky lg:top-28 lg:mt-16 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[#805a27]">Check Availability</p>
          <p className="mt-2 font-display text-3xl leading-none text-[#173c33]">Plan your stay.</p>
        </div>
        <ShieldCheck className="mt-1 size-5 shrink-0 text-[#805a27]" aria-hidden="true" />
      </div>

      <div className="mt-5 min-h-28 border-y border-black/10 py-6" aria-live="polite">
        {!hasDates && (
          <div data-testid="booking-price-prompt">
            <p className="font-display text-3xl leading-tight text-[#173c33]">Select dates to reveal the complete stay total.</p>
            <p className="mt-3 text-xs leading-5 text-black/60">Nightly rates, fees, and taxes appear only after your exact stay is selected.</p>
          </div>
        )}
        {hasDates && loading && (
          <div className="flex items-center gap-3 py-4 text-sm text-black/50">
            <LoaderCircle className="size-5 animate-spin text-[#805a27]" /> Calculating the complete stay...
          </div>
        )}
        {quote && !loading && (
          <div data-testid="booking-panel-total" className="flex items-end justify-between gap-5">
            <div>
              <p className="font-display text-4xl leading-none text-[#173c33]">{formatCurrency(quote.total, quote.currency, { cents: true })}</p>
              <p className="mt-2 text-xs text-black/60">Complete total for {quote.nights} {quote.nights === 1 ? "night" : "nights"}</p>
            </div>
            <p className="max-w-24 text-right text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#805a27]">{quoteSource === "sandbox" ? "Preview total" : "Live stay total"}</p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4">
        <DateRangePicker
          arrivalButtonId="reserve-arrival-date"
          listingId={variant.id}
          checkIn={checkIn}
          checkOut={checkOut}
          onOpenChange={handleCalendarOpenChange}
          onChange={(arrival, departure) => {
            setQuote(null)
            setQuoteSource(null)
            setError("")
            setCheckIn(arrival)
            setCheckOut(departure)
            if (arrival && departure) {
              window.setTimeout(() => document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth", block: "start" }), 180)
            }
          }}
        />
        <div>
          <span className="eyebrow mb-2 block text-black/60">Guests</span>
          <GuestCountControl value={guests} onChange={(value) => { setQuote(null); setQuoteSource(null); setError(""); setGuests(value) }} max={variant.guests} ariaLabel="Reservation guests" />
        </div>
      </div>

      {quote && (
        <div className="mt-5 divide-y divide-black/8 border-y border-black/8">
          {quote.components.filter((component) => component.isIncludedInTotalPrice !== 0 && component.total !== 0).map((component) => (
            <div key={`${component.name}-${component.total}`} className="flex justify-between gap-4 py-3 text-xs text-black/55">
              <span>{component.title}</span>
              <span>{formatCurrency(component.total, quote.currency, { cents: true })}</span>
            </div>
          ))}
        </div>
      )}

      {(error || availabilityError) && <p role="alert" className="mt-5 border border-[#805a27]/25 bg-[#f3eee3] p-4 text-xs leading-6 text-[#173c33]">{error || availabilityError}</p>}

      <div className={`mt-6 grid gap-3 ${bookingLive ? "sm:grid-cols-2" : "grid-cols-1"}`}>
        <Link data-testid="booking-send-inquiry" href={inquiryHref} onClick={() => trackConversionEvent("Stay Inquiry Clicked", { property: property.slug, variant: variant.slug, hasDates })} className={`${bookingLive ? "button-outline text-[#173c33]" : "button-primary"} justify-center px-4`}>{hasDates ? "Request This Stay" : "Ask About This Haven"} <ArrowRight className="size-4" /></Link>
        {bookingLive && (canBook ? (
          <Link data-testid="booking-book-now" href={bookingHref} onClick={() => trackConversionEvent("Book Now Clicked", { property: property.slug, variant: variant.slug, guests })} className="button-primary justify-center px-4">Book Now <ArrowRight className="size-4" /></Link>
        ) : (
          <button data-testid="booking-book-now" type="button" className="button-primary justify-center px-4 disabled:cursor-not-allowed disabled:opacity-45" disabled title={!hasDates ? "Select arrival and departure dates" : loading ? "Calculating your stay total" : "A live quote is required"}>Book Now <ArrowRight className="size-4" /></button>
        ))}
      </div>

      {chatEnabled ? (
        <button
          type="button"
          data-testid="booking-chat-with-us"
          disabled={!hasDates}
          title={!hasDates ? "Select arrival and departure dates" : "Chat with the Enchanted Havens stay team"}
          onClick={() => {
            openTextInquiry({ listingSlug: variant.slug, checkIn, checkOut, guests }, "availability")
            trackConversionEvent("Booking Chat Inquiry Clicked", { property: property.slug, variant: variant.slug, guests })
          }}
          className="mt-3 flex min-h-14 w-full items-center justify-between gap-4 border border-[#805a27]/28 bg-[#f3eee3] px-4 text-left text-[#173c33] transition hover:border-[#805a27]/55 hover:bg-[#ece4d5] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#805a27]/30 text-[#805a27]"><MessageCircle className="size-4" aria-hidden="true" /></span>
            <span><span className="block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#805a27]">Prefer a quick reply?</span><span className="mt-0.5 block font-display text-xl leading-none">Chat about these dates</span></span>
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </button>
      ) : null}

      <p className="mt-6 flex items-start gap-3 border-t border-black/10 pt-5 text-xs leading-5 text-black/58"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#805a27]" /> Secure direct booking with personal support from Enchanted Havens.</p>
    </aside>
  )
}
