"use client"

import { createPortal } from "react-dom"
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, LoaderCircle, MessageCircle, ShieldCheck, X } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import type { TextInquiryContext } from "@/components/text-inquiry/text-inquiry-provider"
import { trackConversionEvent } from "@/lib/analytics"
import { getTextInquiryListing, textInquiryListings } from "@/lib/text-inquiry-listings"

const COUNTRY_CALLING_CODES = [
  { value: "+1", label: "US/CA +1" },
  { value: "+44", label: "UK +44" },
  { value: "+52", label: "Mexico +52" },
  { value: "+55", label: "Brazil +55" },
  { value: "+60", label: "Malaysia +60" },
  { value: "+61", label: "Australia +61" },
  { value: "+65", label: "Singapore +65" },
  { value: "+81", label: "Japan +81" },
  { value: "+91", label: "India +91" },
  { value: "+971", label: "UAE +971" },
]

type TextInquiryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: TextInquiryContext | null
}

export function TextInquiryDialog({ open, onOpenChange, context }: TextInquiryDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const [guestName, setGuestName] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [countryCallingCode, setCountryCallingCode] = useState("+1")
  const [listingSlug, setListingSlug] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(2)
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")
  const [idempotencyKey, setIdempotencyKey] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")
  const [error, setError] = useState("")
  const [inquiryId, setInquiryId] = useState("")
  const selectedListing = useMemo(() => getTextInquiryListing(listingSlug), [listingSlug])
  const individualHavens = textInquiryListings.filter((listing) => listing.propertySlug !== "whidbey-estate")
  const coveClubResidences = textInquiryListings.filter((listing) => listing.propertySlug === "whidbey-estate")

  useEffect(() => {
    if (!open) return
    const resetFrame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search)
      const initialListing = getTextInquiryListing(context?.listingSlug || "")
      const requestedGuests = context?.guests || Number.parseInt(params.get("guests") || "", 10) || 2
      setListingSlug(initialListing?.listingSlug || "")
      setCheckIn(context?.checkIn || params.get("checkIn") || "")
      setCheckOut(context?.checkOut || params.get("checkOut") || "")
      setGuests(Math.max(1, Math.min(requestedGuests, initialListing?.maxGuests || 60)))
      setMessage("")
      setWebsite("")
      setIdempotencyKey(window.crypto.randomUUID())
      setState("idle")
      setError("")
      setInquiryId("")
    })
    return () => window.cancelAnimationFrame(resetFrame)
  }, [context, open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const isolatedElements = [document.querySelector("header"), document.getElementById("main-content"), document.querySelector("footer")]
      .filter((element): element is HTMLElement => element instanceof HTMLElement)
    const previousIsolation = isolatedElements.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }))
    document.body.style.overflow = "hidden"
    nameRef.current?.focus({ preventScroll: true })
    isolatedElements.forEach((element) => {
      element.inert = true
      element.setAttribute("aria-hidden", "true")
    })

    function handleKeyDown(event: KeyboardEvent) {
      const activeDialog = document.activeElement?.closest('[role="dialog"]')
      if (activeDialog !== dialogRef.current) return
      if (event.key === "Escape") {
        event.preventDefault()
        onOpenChange(false)
        return
      }
      if (event.key !== "Tab") return

      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || []).filter((element) => !element.hasAttribute("aria-hidden"))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1) || first
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      previousIsolation.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert
        if (ariaHidden === null) element.removeAttribute("aria-hidden")
        else element.setAttribute("aria-hidden", ariaHidden)
      })
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onOpenChange, open])

  function handleListingChange(nextListingSlug: string) {
    const nextListing = getTextInquiryListing(nextListingSlug)
    setListingSlug(nextListingSlug)
    setCheckIn("")
    setCheckOut("")
    setGuests((current) => Math.min(current, nextListing?.maxGuests || current))
    setError("")
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === "sending") return
    setError("")

    if (!guestName.trim() || !guestPhone.trim() || !selectedListing || !checkIn || !checkOut) {
      setError("Add your name, mobile number, haven, and stay dates.")
      return
    }

    setState("sending")
    trackConversionEvent("Text Inquiry Started", { listing: selectedListing.listingSlug, sourcePath: context?.sourcePath || window.location.pathname })

    try {
      const response = await fetch("/api/inquiry/text", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKey || window.crypto.randomUUID(),
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          countryCallingCode,
          listingSlug: selectedListing.listingSlug,
          checkIn,
          checkOut,
          guests,
          message: message.trim(),
          sourcePath: context?.sourcePath || window.location.pathname,
          website,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.textMessageSent) throw new Error(data?.error || "We couldn't send your text. Please try again.")

      setInquiryId(String(data.inquiryId || ""))
      setState("sent")
      trackConversionEvent("Text Inquiry Created", {
        inquiryId: String(data.inquiryId || ""),
        listing: selectedListing.listingSlug,
        smsStatus: String(data.smsStatus || "unknown"),
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn't send your text. Please try again.")
      setState("idle")
    }
  }

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#071e19]/62 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false) }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-inquiry-title"
        aria-describedby="text-inquiry-description"
        className="relative max-h-[94dvh] w-full overflow-y-auto border border-[#d4b47d]/30 bg-[#faf7f0] shadow-[0_30px_90px_rgba(7,30,25,.45)] sm:max-w-xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-white/10 bg-[#173c33] px-6 py-5 text-[#f3eee3] sm:px-8 sm:py-6">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full border border-[#d4b47d]/40 text-[#d4b47d]">
              <MessageCircle className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow text-[#d4b47d]">Personal Stay Guidance</p>
              <h2 id="text-inquiry-title" className="mt-1 font-display text-3xl leading-none">Text with us.</h2>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="grid size-10 shrink-0 place-items-center border border-white/20 text-white transition hover:bg-white/10" aria-label="Close text inquiry">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {state === "sent" ? (
          <div className="px-7 py-12 text-center sm:px-12 sm:py-16">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#173c33]/8 text-[#173c33]">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </span>
            <h3 className="mt-6 font-display text-4xl leading-none text-[#173c33]">Check your messages.</h3>
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-black/60">We sent a text to the mobile number you provided. Reply to continue directly with the Enchanted Havens stay team.</p>
            {inquiryId ? <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#805a27]">Inquiry {inquiryId}</p> : null}
            <button type="button" onClick={() => onOpenChange(false)} className="button-primary mt-8 min-w-40">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-5 px-6 py-6 sm:px-8 sm:py-8" aria-busy={state === "sending"}>
            <p id="text-inquiry-description" className="text-sm leading-7 text-black/60">Share a few stay details and we&apos;ll text the number you provide. Reply to that message to connect with our team.</p>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="eyebrow mb-2 block text-black/60">Name</span>
                <input ref={nameRef} className="field" autoComplete="name" value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Your name" required disabled={state === "sending"} />
              </label>

              <label className="sm:col-span-2">
                <span className="eyebrow mb-2 block text-black/60">Mobile number</span>
                <span className="grid grid-cols-[8.4rem_minmax(0,1fr)] gap-2">
                  <select className="field h-[3.6rem] px-3 text-sm" aria-label="Country calling code" value={countryCallingCode} onChange={(event) => setCountryCallingCode(event.target.value)} disabled={state === "sending"}>
                    {COUNTRY_CALLING_CODES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <input className="field min-w-0" type="tel" inputMode="tel" autoComplete="tel" value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} placeholder="555 123 4567" required disabled={state === "sending"} />
                </span>
                <span className="mt-2 block text-xs leading-5 text-black/48">Use a mobile number that can receive SMS. Two-way texting is most reliable in the US, Canada, and UK.</span>
              </label>

              <label className="sm:col-span-2">
                <span className="eyebrow mb-2 block text-black/60">Haven</span>
                <select className="field h-[3.6rem]" value={listingSlug} onChange={(event) => handleListingChange(event.target.value)} required disabled={state === "sending"}>
                  <option value="">Select a haven</option>
                  <optgroup label="Enchanted Havens">
                    {individualHavens.map((listing) => <option key={listing.listingSlug} value={listing.listingSlug}>{listing.name}</option>)}
                  </optgroup>
                  <optgroup label="The Cove Club">
                    {coveClubResidences.map((listing) => <option key={listing.listingSlug} value={listing.listingSlug}>{listing.name}</option>)}
                  </optgroup>
                </select>
              </label>

              <fieldset disabled={!selectedListing || state === "sending"} className="min-w-0 border-0 p-0 disabled:opacity-55 sm:col-span-2">
                <legend className="eyebrow mb-2 block text-black/60">Stay dates</legend>
                <DateRangePicker
                  key={selectedListing?.listingId || "no-haven"}
                  listingId={selectedListing?.listingId}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onChange={(arrival, departure) => { setCheckIn(arrival); setCheckOut(departure); setError("") }}
                />
                {!selectedListing ? <p className="mt-2 text-xs text-black/48">Choose a haven to see its live availability.</p> : null}
              </fieldset>

              <label className="sm:col-span-2">
                <span className="eyebrow mb-2 block text-black/60">Guests</span>
                <select className="field h-[3.6rem]" value={guests} onChange={(event) => setGuests(Number(event.target.value))} disabled={state === "sending"}>
                  {Array.from({ length: selectedListing?.maxGuests || 12 }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>
                  ))}
                </select>
              </label>

              <label className="sm:col-span-2">
                <span className="eyebrow mb-2 block text-black/60">How can we help? <span className="normal-case tracking-normal text-black/40">(optional)</span></span>
                <textarea className="field min-h-28 resize-y" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} placeholder="Availability, a special request, or anything else…" disabled={state === "sending"} />
              </label>
            </div>

            <label className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
            {error ? <p role="alert" className="border border-red-900/20 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900">{error}</p> : null}

            <div className="flex items-start gap-3 border border-[#805a27]/20 bg-[#f3eee3] p-4 text-xs leading-6 text-black/55">
              <ShieldCheck className="mt-1 size-4 shrink-0 text-[#805a27]" aria-hidden="true" />
              <p>Your details are shared securely with the Enchanted Havens team so we can help with the right home, dates, and request.</p>
            </div>

            <button type="submit" className="button-primary w-full disabled:cursor-wait disabled:opacity-75" disabled={state === "sending"}>
              {state === "sending" ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Sending text…</> : "Send me a text"}
            </button>
            <p className="text-center text-[0.68rem] leading-5 text-black/45">By continuing, you agree to receive a transactional text about this inquiry. Message and data rates may apply. Reply STOP to opt out.</p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
