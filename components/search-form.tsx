"use client"

import { ArrowRight, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState, useTransition } from "react"
import { DateRangePicker } from "@/components/date-range-picker"
import { GuestCountControl } from "@/components/guest-count-control"
import { trackConversionEvent } from "@/lib/analytics"

export function SearchForm({
  dark = false,
  compact = false,
  initialCheckIn = "",
  initialCheckOut = "",
  initialGuests = 2,
  preservedQuery = "",
}: {
  dark?: boolean
  compact?: boolean
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
  preservedQuery?: string
}) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [guests, setGuests] = useState(Math.max(1, initialGuests))
  const [searching, startSearch] = useTransition()

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!checkIn || !checkOut || searching) return

    const params = new URLSearchParams(preservedQuery)
    params.set("checkIn", checkIn)
    params.set("checkOut", checkOut)
    params.set("guests", String(guests))
    trackConversionEvent("Stay Search Started", { checkIn, checkOut, guests })
    startSearch(() => router.push(`/havens?${params.toString()}#collection`))
  }

  return (
    <form action="/havens#collection" method="get" onSubmit={submitSearch} id="availability" aria-busy={searching} className={`border ${dark ? "border-white/15 bg-[#f3eee3] text-[#18221f]" : "border-[#173c33]/10 bg-[#fffdf8] text-[#18221f] shadow-[0_24px_70px_rgba(7,30,25,0.16)]"}`}>
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      <div className={`grid items-stretch ${compact ? "lg:grid-cols-[2fr_0.65fr_auto]" : "lg:grid-cols-[2fr_0.68fr_auto]"}`}>
        <div className="border-b border-[#173c33]/10 lg:border-b-0 lg:border-r">
          <DateRangePicker checkIn={checkIn} checkOut={checkOut} onChange={(arrival, departure) => { setCheckIn(arrival); setCheckOut(departure) }} appearance="search" />
        </div>
        <div className="group border-b border-[#173c33]/10 transition-colors hover:bg-[#f3eee3] lg:border-b-0 lg:border-r">
          <GuestCountControl value={guests} onChange={setGuests} max={60} name="guests" appearance="search" ariaLabel="Search guests" label="Guests" />
        </div>
        <button data-testid="search-stays" type="submit" disabled={!checkIn || !checkOut || searching} className="m-2.5 flex min-h-14 items-center justify-center gap-3 bg-[#173c33] px-7 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white transition-colors enabled:hover:bg-[#071e19] disabled:cursor-not-allowed disabled:bg-[#60756e] disabled:text-white/90 sm:m-3">
          {searching ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {searching ? "Searching..." : "Search Stays"}
          {!searching ? <ArrowRight className="size-4" /> : null}
        </button>
      </div>
    </form>
  )
}
