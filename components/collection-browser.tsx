"use client"

import { format, parseISO } from "date-fns"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, LoaderCircle, RotateCcw, SlidersHorizontal } from "lucide-react"
import { GuestCountControl } from "@/components/guest-count-control"
import { PropertyCard } from "@/components/property-card"
import { trackConversionEvent } from "@/lib/analytics"
import type { Property, PropertyVariant } from "@/lib/schemas"

type SearchQuote = { total: number; currency: string; nights: number }
type SearchResult = { propertySlug: string; availableListingIds: number[]; variants?: Array<{ listingId: number; variantSlug: string; quote: SearchQuote }> }
type CollectionEntry = { key: string; property: Property; variant?: PropertyVariant; quote?: SearchQuote }

const experienceOptions = ["Waterfront", "Lakefront", "Oceanfront", "Hot tub", "Sauna", "Dock", "Pet-friendly", "Private estate"] as const

function normalizedExperience(value?: string) {
  if (value === "waterfront") return "Waterfront"
  if (value === "wellness") return "Hot tub"
  if (value === "gatherings") return "Private estate"
  return experienceOptions.find((option) => option.toLowerCase() === value?.toLowerCase()) || ""
}

function experienceMatches(property: Property, experience: string) {
  if (!experience) return true
  const text = [...property.experienceTags, ...property.variants.flatMap((variant) => variant.amenities)].join(" ").toLowerCase()
  if (experience === "Waterfront") return /(water|lake|ocean|beach|dock)/.test(text)
  if (experience === "Lakefront") return /(lakefront|lakeside|lake view|lake access)/.test(text)
  if (experience === "Oceanfront") return /(ocean|beachfront|sea view|coast)/.test(text)
  if (experience === "Private estate") return Boolean(property.estate) || text.includes("private estate")
  return text.includes(experience.toLowerCase())
}

export function CollectionBrowser({ properties, initialGuests = 1, initialCheckIn, initialCheckOut, initialExperience, initialIntent, initialPropertySlugs = [], queryString = "" }: { properties: Property[]; initialGuests?: number; initialCheckIn?: string; initialCheckOut?: string; initialExperience?: string; initialIntent?: string; initialPropertySlugs?: string[]; queryString?: string }) {
  const [guests, setGuests] = useState(initialGuests)
  const [experience, setExperience] = useState(normalizedExperience(initialExperience))
  const [availability, setAvailability] = useState<SearchResult[] | null>(null)
  const [availabilityMessage, setAvailabilityMessage] = useState("")
  const [checkingAvailability, setCheckingAvailability] = useState(Boolean(initialCheckIn && initialCheckOut))

  useEffect(() => {
    if (!initialCheckIn || !initialCheckOut) return
    const controller = new AbortController()
    fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIn: initialCheckIn, checkOut: initialCheckOut, guests: initialGuests }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Live availability is not configured yet.")
        return data.results as SearchResult[]
      })
      .then((results) => {
        setAvailability(results)
        trackConversionEvent(results.length ? "Stay Search Completed" : "Stay Search No Results", { results: results.length, guests: initialGuests })
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setAvailabilityMessage(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingAvailability(false)
      })
    return () => controller.abort()
  }, [initialCheckIn, initialCheckOut, initialGuests])

  const hasDateSearch = Boolean(initialCheckIn && initialCheckOut)
  const availabilityPending = hasDateSearch && checkingAvailability && !availability && !availabilityMessage
  const filtered = useMemo<CollectionEntry[]>(() => properties.flatMap((property) => {
    if (initialPropertySlugs.length && !initialPropertySlugs.includes(property.slug)) return []
    if (!experienceMatches(property, experience)) return []

    if (!availability) {
      if (availabilityPending) return []
      if (property.estate) return []
      const capacityMatch = property.variants.some((variant) => variant.guests >= guests)
      return capacityMatch ? [{ key: property.slug, property }] : []
    }

    const result = availability.find((item) => item.propertySlug === property.slug)
    if (!result) return []
    if (!property.estate) {
      const selected = property.variants
        .filter((variant) => variant.guests >= guests && result.availableListingIds.includes(variant.id))
        .map((variant) => ({ variant, quote: result.variants?.find((item) => item.listingId === variant.id)?.quote }))
        .sort((a, b) => (a.quote?.total || Infinity) - (b.quote?.total || Infinity))[0]
      return selected ? [{ key: property.slug, property, quote: selected.quote }] : []
    }

    return property.variants
      .filter((variant) => result.availableListingIds.includes(variant.id) && variant.guests >= guests)
      .map((variant) => ({ key: `${property.slug}:${variant.slug}`, property, variant, quote: result.variants?.find((item) => item.listingId === variant.id)?.quote }))
  }), [properties, guests, experience, availability, availabilityPending, initialPropertySlugs])

  const hasPreferenceFilters = guests > 1 || Boolean(experience)
  const maxGuests = useMemo(() => Math.max(16, ...properties.flatMap((property) => property.variants.map((variant) => variant.guests))), [properties])

  return (
    <div id="collection" className="scroll-mt-28">
      <div className="mb-14 border-y border-black/10 py-7 lg:mb-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3 text-[0.66rem] font-bold uppercase tracking-[0.17em] text-[#173c33]"><SlidersHorizontal className="size-4" /> Shape your stay</div>
          <div className="flex flex-1 flex-wrap gap-2 lg:max-w-4xl lg:justify-center">
            {experienceOptions.map((option) => <button key={option} type="button" onClick={() => setExperience(experience === option ? "" : option)} className={`border px-3.5 py-2 text-[0.66rem] font-semibold tracking-[0.04em] transition ${experience === option ? "border-[#173c33] bg-[#173c33] text-white" : "border-black/14 text-black/58 hover:border-[#173c33] hover:text-[#173c33]"}`}>{option}</button>)}
          </div>
          <div className="flex items-center justify-between gap-3 text-xs lg:justify-start"><span className="font-bold uppercase tracking-[0.13em] text-[#173c33]">Guests</span><GuestCountControl value={guests} onChange={setGuests} max={maxGuests} appearance="filter" ariaLabel="Filter by guests" /></div>
        </div>
      </div>

      {availabilityMessage && <p className="mb-10 border border-[#805a27]/35 bg-[#f3eee3] px-5 py-4 text-sm leading-6 text-[#173c33]">{availabilityMessage} The collection remains available to browse, and each property links to the current booking engine as a fallback.</p>}

      {initialIntent && initialPropertySlugs.length ? <div className="mb-10 flex flex-col gap-3 border-l-2 border-[#805a27] bg-[#f3eee3] px-5 py-4 text-sm leading-6 text-[#173c33] sm:flex-row sm:items-center sm:justify-between"><p>Showing havens matched to <strong>{initialIntent.replaceAll("-", " ")}</strong>. Your dates and guest count will stay attached as you compare.</p><Link href="/havens#collection" className="shrink-0 text-[0.64rem] font-bold uppercase tracking-[0.14em]">View full collection</Link></div> : null}

      {hasDateSearch && !availabilityMessage && (
        <div data-testid="availability-results-status" role="status" aria-live="polite" className="mb-10 flex flex-col gap-3 border border-[#173c33]/14 bg-[#f3eee3] px-5 py-4 text-sm leading-6 text-[#173c33] sm:flex-row sm:items-center sm:justify-between">
          <p>{checkingAvailability || !availability
            ? "Checking live availability for your stay..."
            : `${filtered.length} ${filtered.length === 1 ? "stay" : "stays"} available for ${format(parseISO(initialCheckIn!), "MMM d")}–${format(parseISO(initialCheckOut!), "MMM d, yyyy")} · ${initialGuests} ${initialGuests === 1 ? "guest" : "guests"}`}</p>
          <Link href="/havens#collection" className="shrink-0 text-[0.64rem] font-bold uppercase tracking-[0.14em]">Browse without dates</Link>
        </div>
      )}

      {availabilityPending ? (
        <div data-testid="availability-loading-results" role="status" className="grid min-h-[32rem] place-items-center border-y border-black/10 bg-[#f3eee3]/55 px-6 text-center">
          <div>
            <LoaderCircle className="mx-auto size-7 animate-spin text-[#805a27]" />
            <p className="mt-5 font-display text-4xl text-[#173c33]">Matching your stay.</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-black/58">Checking each haven before showing results, so every property you select is stable and available for these dates.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-9 flex items-center justify-between gap-5">
            <p className="text-sm text-black/60"><span className="font-semibold text-[#173c33]">{filtered.length}</span> {filtered.length === 1 ? "private stay" : "private stays"}</p>
            {hasPreferenceFilters && <button type="button" onClick={() => { setGuests(1); setExperience("") }} className="inline-flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#173c33]"><RotateCcw className="size-3.5" /> Clear preferences</button>}
          </div>

          <div className="grid gap-12 lg:gap-16">
            {filtered.map((entry, index) => <div key={entry.key} onClick={() => trackConversionEvent("Stay Selected", { property: entry.property.slug, variant: entry.variant?.slug || entry.property.variants[0].slug })}><PropertyCard property={entry.property} variant={entry.variant} quote={entry.quote} priority={index === 0} layout="editorial" index={index} queryString={queryString} /></div>)}
          </div>
        </>
      )}

      {!availabilityPending && filtered.length === 0 && (
        <div className="border border-black/10 bg-[#f3eee3] p-8 text-center sm:p-12">
          <h2 className="font-display text-4xl text-[#173c33]">Let us shape the right stay.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-black/58">{guests >= 13 ? "The Cove Club can welcome groups of up to 42 across a private Whidbey Island estate. Large gatherings are planned personally so the right residences, dates, and spaces stay together." : "These exact preferences are not available together. Explore flexible dates, clear one preference, or ask our stay team to recommend the closest fit."}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {guests >= 13 ? <Link href={`/contact?tripType=The+Cove+Club&guests=${guests}`} className="button-primary">Plan a Cove Club Stay <ArrowRight className="size-4" /></Link> : null}
            {hasDateSearch ? <Link href="/havens#availability" className="button-outline text-[#173c33]">Explore flexible dates</Link> : null}
            <button type="button" onClick={() => { setGuests(1); setExperience("") }} className="button-outline text-[#173c33]">View every haven</button>
            <Link href="/contact" className="button-outline text-[#173c33]">Ask the stay team</Link>
          </div>
        </div>
      )}
    </div>
  )
}
