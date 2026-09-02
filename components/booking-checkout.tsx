"use client"

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, LoaderCircle, LockKeyhole, ShieldCheck, Tag, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DateRangePicker } from "@/components/date-range-picker"
import { GuestCountControl } from "@/components/guest-count-control"
import { trackConversionEvent } from "@/lib/analytics"
import { arrivalCopy, bookingPolicyCopy, getBookingTermsSummary } from "@/lib/booking-terms"
import { formatUsPhoneInput } from "@/lib/phone"
import type { Property, PropertyVariant, Quote } from "@/lib/schemas"
import { formatCurrency } from "@/lib/utils"

type AppliedCoupon = { id: string; code: string; discountAmount: number; label: string }
type SetupData = { clientSecret: string; sessionId: string; coupon?: AppliedCoupon | null }
type QuoteSource = "hostaway" | "sandbox"

function FieldLabel({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label><span className="eyebrow mb-2 block text-black/60">{label}{required && <span aria-hidden="true" className="text-[#805a27]"> *</span>}</span>{children}</label>
}

type GuestFormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  specialRequests: string
}

const emptyGuestForm: GuestFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  specialRequests: "",
}

type ReservationDetailsFormProps = {
  property: Property
  variant: PropertyVariant
  checkIn: string
  checkOut: string
  guests: number
  guest: GuestFormState
  setGuest: React.Dispatch<React.SetStateAction<GuestFormState>>
  sandboxMode: boolean
  couponCode?: string
  onQuoteReady: (quote: Quote, source: QuoteSource, coupon?: AppliedCoupon | null) => void
}

function ReservationDetailsForm({ property, variant, checkIn, checkOut, guests, guest, setGuest, sandboxMode, couponCode, onQuoteReady }: ReservationDetailsFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [consent, setConsent] = useState(false)
  const [paymentReady, setPaymentReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationError, setConfirmationError] = useState("")
  const terms = getBookingTermsSummary(variant)

  async function completeBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stripe || !elements || !consent || submitting) return
    setSubmitting(true)
    setConfirmationError("")
    trackConversionEvent("Checkout Submitted", { property: property.slug, variant: variant.slug, guests })

    try {
      const { error: elementError } = await elements.submit()
      if (elementError) throw new Error(elementError.message || "Please check your payment information.")

      const setupResponse = await fetch("/api/checkout/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertySlug: property.slug,
          variantSlug: variant.slug,
          listingId: variant.id,
          checkIn,
          checkOut,
          guests,
          couponCode,
          guest: { ...guest, country: "US" },
        }),
      })
      const setup = await setupResponse.json().catch(() => ({})) as Partial<SetupData> & { error?: string; quote?: Quote; source?: QuoteSource }
      if (!setupResponse.ok) throw new Error(setup.error || "Secure checkout could not start.")
      if (!setup.clientSecret || !setup.sessionId) throw new Error("Stripe did not return a secure checkout session. Please try again.")
      if (setup.quote) onQuoteReady(setup.quote, setup.source === "sandbox" ? "sandbox" : "hostaway", setup.coupon)

      const result = await stripe.confirmSetup({
        elements,
        clientSecret: setup.clientSecret,
        redirect: "if_required",
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: `${guest.firstName} ${guest.lastName}`,
              email: guest.email,
              phone: guest.phone,
            },
          },
        },
      })
      if (result.error) throw new Error(result.error.message || "Your card could not be verified.")
      if (!result.setupIntent) throw new Error("Stripe did not return a verified payment method. Please try again.")

      const confirmationResponse = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: setup.sessionId, setupIntentId: result.setupIntent.id, consent: true }),
      })
      const confirmation = await confirmationResponse.json().catch(() => ({}))
      if (!confirmationResponse.ok) throw new Error(confirmation.error || "Your reservation could not be confirmed.")
      if (!confirmation.confirmationUrl) throw new Error("Your reservation response was incomplete. Please contact our stay team.")
      trackConversionEvent("Checkout Confirmed", { property: property.slug, variant: variant.slug, sandbox: sandboxMode })
      window.location.assign(confirmation.confirmationUrl)
    } catch (error) {
      trackConversionEvent("Checkout Error", { property: property.slug, variant: variant.slug })
      setConfirmationError(error instanceof Error ? error.message : "Your reservation could not be confirmed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form id="guest-payment" onSubmit={completeBooking} onInvalidCapture={() => trackConversionEvent("Checkout Validation Error", { property: property.slug, variant: variant.slug })} className="scroll-mt-28 mt-10 border-t border-black/10 pt-9">
      <div>
        <p className="eyebrow text-[#805a27]">Step 2 · Complete your reservation</p>
        <h2 className="mt-2 font-display text-4xl text-[#173c33]">Guest and payment details</h2>
        <p className="mt-3 text-sm leading-7 text-black/60">Your contact details and secure payment method stay together on one page. <strong className="font-semibold text-[#173c33]">No payment is collected today.</strong></p>
        <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-black/60"><span aria-hidden="true" className="text-[#805a27]">*</span> Required fields</p>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <FieldLabel label="First name" required><input className="field" name="firstName" autoComplete="given-name" required value={guest.firstName} onChange={(event) => setGuest((current) => ({ ...current, firstName: event.target.value }))} /></FieldLabel>
        <FieldLabel label="Last name" required><input className="field" name="lastName" autoComplete="family-name" required value={guest.lastName} onChange={(event) => setGuest((current) => ({ ...current, lastName: event.target.value }))} /></FieldLabel>
        <FieldLabel label="Email" required><input className="field" type="email" name="email" autoComplete="email" required value={guest.email} onChange={(event) => setGuest((current) => ({ ...current, email: event.target.value }))} /></FieldLabel>
        <FieldLabel label="Phone" required><input className="field" type="tel" inputMode="numeric" name="phone" autoComplete="tel-national" placeholder="(770)123-1234" pattern="\(\d{3}\)\d{3}-\d{4}" maxLength={13} required value={guest.phone} onChange={(event) => setGuest((current) => ({ ...current, phone: formatUsPhoneInput(event.target.value) }))} /></FieldLabel>
        <div className="sm:col-span-2"><FieldLabel label="Special requests · optional"><textarea className="field min-h-28" name="specialRequests" value={guest.specialRequests} onChange={(event) => setGuest((current) => ({ ...current, specialRequests: event.target.value }))} /></FieldLabel></div>
      </div>

      <div className="mt-9 flex items-center justify-between gap-5 border-t border-black/10 pt-9">
        <div><p className="eyebrow text-[#805a27]">Secure payment method</p><h3 className="mt-2 font-display text-3xl text-[#173c33]">Card information</h3></div>
        <LockKeyhole className="size-5 text-[#805a27]" />
      </div>
      <p className="mt-3 text-sm leading-7 text-black/52">Stripe securely verifies and stores your payment method. Enchanted Havens never receives your card number, and your stay team will process payment manually according to the booking terms.</p>
      <div className="mt-6 border border-[#173c33]/14 bg-[#f3eee3] p-5 text-sm leading-7 text-black/62">
        <p className="font-semibold text-[#173c33]">Payment and cancellation</p>
        <p className="mt-2">No payment is collected today. Your card is saved securely for the stay team to process manually.</p>
        <p className="mt-2"><strong>{terms.policyName} cancellation:</strong> {bookingPolicyCopy(terms)}</p>
        <p className="mt-2">{arrivalCopy(terms)} No separate refundable damage deposit is configured for this listing.</p>
        <Link href="/terms" className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.13em] text-[#173c33] underline decoration-[#805a27]/50 underline-offset-4">Read full booking terms</Link>
      </div>
      <div className="mt-6 border border-black/10 bg-white p-4 sm:p-5">
        <PaymentElement
          onReady={() => setPaymentReady(true)}
          onChange={() => setConfirmationError("")}
          options={{
            layout: { type: "accordion", defaultCollapsed: false, radios: "never", spacedAccordionItems: false },
            paymentMethodOrder: ["card"],
            wallets: { applePay: "never", googlePay: "never", link: "never" },
            fields: { billingDetails: { name: "never", email: "never", phone: "never", address: "auto" } },
          }}
        />
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 border border-black/10 bg-[#f3eee3] p-4 text-xs leading-6 text-black/62">
        <input type="checkbox" className="mt-1 size-4 accent-[#173c33]" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>{sandboxMode ? <>I understand this is a Stripe test-mode verification. <strong className="text-[#173c33]">No real reservation or charge will be created.</strong></> : <>I authorize Enchanted Havens to save this payment method securely for our guest service team to charge manually according to the <Link href="/terms" className="underline decoration-[#805a27] underline-offset-2">booking terms</Link>. <strong className="text-[#173c33]">No payment is collected today.</strong></>}</span>
      </label>
      {confirmationError && <div role="alert" aria-live="assertive" className="mt-5 flex items-start gap-3 border border-[#a44735]/30 bg-[#fff5f1] p-4 text-sm leading-6 text-[#7d2f22]"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{confirmationError}</span></div>}
      <button type="submit" data-testid="complete-booking" disabled={!stripe || !elements || !paymentReady || !consent || submitting} className="button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-45">
        {submitting ? "Securing your reservation..." : <>Complete Booking <LockKeyhole className="size-4" /></>}
      </button>
      <p className="mt-3 text-center text-[0.68rem] leading-5 text-black/45">Your card is saved securely for manual processing. It is not charged by this form.</p>
    </form>
  )
}

type BookingCheckoutProps = {
  property: Property
  variant: PropertyVariant
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
  initialCouponCode?: string
  bookingLive: boolean
  quoteAvailable: boolean
  sandboxMode?: boolean
  publishableKey?: string
}

export function BookingCheckout({ property, variant, initialCheckIn = "", initialCheckOut = "", initialGuests = 2, initialCouponCode = "", bookingLive, quoteAvailable, sandboxMode = false, publishableKey }: BookingCheckoutProps) {
  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [guests, setGuests] = useState(Math.min(Math.max(initialGuests, 1), variant.guests))
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteSource, setQuoteSource] = useState<QuoteSource | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [couponInput, setCouponInput] = useState(initialCouponCode)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [couponError, setCouponError] = useState("")
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [guest, setGuest] = useState<GuestFormState>(emptyGuestForm)
  const checkoutTracked = useRef(false)
  const stripePromise = useMemo(() => publishableKey ? loadStripe(publishableKey) : null, [publishableKey])
  const hasDates = Boolean(checkIn && checkOut)
  const currentStep = quote ? 2 : 1

  useEffect(() => {
    if (checkoutTracked.current) return
    checkoutTracked.current = true
    trackConversionEvent("Checkout Started", { property: property.slug, variant: variant.slug, sandbox: sandboxMode })
  }, [property.slug, sandboxMode, variant.slug])

  const inquiryHref = useMemo(() => {
    const params = new URLSearchParams({ property: property.slug, variant: variant.slug, checkIn, checkOut, guests: String(guests) })
    return `/contact?${params.toString()}`
  }, [checkIn, checkOut, guests, property.slug, variant.slug])

  const requestQuote = useCallback(async (signal?: AbortSignal) => {
    if (!checkIn || !checkOut || !quoteAvailable) return
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: variant.id, checkIn, checkOut, guests }),
        signal,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to calculate this stay.")
      setQuote(data.quote)
      setQuoteSource(data.source === "sandbox" ? "sandbox" : "hostaway")
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return
      setQuote(null)
      setQuoteSource(null)
      setError(requestError instanceof Error ? requestError.message : "Unable to calculate this stay.")
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [checkIn, checkOut, guests, quoteAvailable, variant.id])

  useEffect(() => {
    if (!hasDates || !quoteAvailable) return
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => void requestQuote(controller.signal), 0)
    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [hasDates, quoteAvailable, requestQuote])

  function updateDates(arrival: string, departure: string) {
    setQuote(null)
    setQuoteSource(null)
    setError("")
    setAppliedCoupon(null)
    setCouponError("")
    setCheckIn(arrival)
    setCheckOut(departure)
  }

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code || !checkIn || !checkOut) return
    setApplyingCoupon(true)
    setCouponError("")
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: variant.id, checkIn, checkOut, guests, couponCode: code }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "This coupon could not be applied.")
      if (!data.coupon) throw new Error("This coupon could not be applied.")
      setQuote(data.quote)
      setQuoteSource(data.source === "sandbox" ? "sandbox" : "hostaway")
      setAppliedCoupon(data.coupon)
      setCouponInput(data.coupon.code)
      trackConversionEvent("Coupon Applied", { property: property.slug, variant: variant.slug })
    } catch (couponRequestError) {
      setCouponError(couponRequestError instanceof Error ? couponRequestError.message : "This coupon could not be applied.")
    } finally {
      setApplyingCoupon(false)
    }
  }

  async function removeCoupon() {
    setAppliedCoupon(null)
    setCouponInput("")
    setCouponError("")
    await requestQuote()
  }

  return (
    <div className="grid min-h-[calc(100dvh-var(--header-height))] bg-[#faf7f0] pb-24 lg:grid-cols-[1fr_0.72fr] lg:pb-0">
      <div className="px-5 pb-16 pt-8 sm:px-10 lg:px-[7vw] lg:py-16">
        <div className="relative -mx-5 -mt-8 mb-8 h-52 sm:-mx-10 lg:hidden">
          <Image src={variant.images[0]} alt="" fill loading="eager" quality={90} sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071e19]/65 to-transparent" />
          <p className="absolute bottom-5 left-5 font-display text-3xl text-white">{variant.shortName}</p>
        </div>
        <Link href={property.estate ? `/havens/${property.slug}/${variant.slug}` : `/havens/${property.slug}`} className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#173c33]"><ArrowLeft className="size-4" /> Back to {variant.shortName}</Link>

        {sandboxMode && <div className="mt-7 flex items-start gap-3 border border-[#805a27]/35 bg-[#f3eee3] px-4 py-3 text-xs leading-6 text-[#173c33]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#805a27]" /><p><strong className="uppercase tracking-[0.12em]">Stripe sandbox</strong> · Live Hostaway availability and pricing are enabled. Test cards only; Hostaway reservation writes and email delivery are disabled.</p></div>}

        <div className="mt-9 flex max-w-2xl items-center gap-2" aria-label={`Booking step ${currentStep} of 2`}>
          {["Stay", "Guest & payment"].map((label, index) => <div key={label} className="flex flex-1 items-center gap-2"><span className={`grid size-6 shrink-0 place-items-center border text-[0.6rem] font-bold ${currentStep > index ? "border-[#173c33] bg-[#173c33] text-white" : "border-black/15 text-black/35"}`}>{currentStep > index + 1 ? <Check className="size-3.5" /> : index + 1}</span><span className={`hidden text-[0.6rem] font-bold uppercase tracking-[0.12em] sm:block ${currentStep > index ? "text-[#173c33]" : "text-black/32"}`}>{label}</span>{index < 1 && <span className="h-px flex-1 bg-black/10" />}</div>)}
        </div>

        <p className="eyebrow mt-10 text-[#805a27]">{sandboxMode ? "Direct Reservation Preview" : "Direct Reservation"}</p>
        <h1 className="display-balance mt-4 max-w-2xl font-display text-5xl leading-[0.92] text-[#173c33] sm:text-6xl">Reserve {variant.shortName}</h1>
        <p className="copy-balance mt-5 max-w-xl leading-8 text-black/56">{sandboxMode ? "Walk through the native Enchanted Havens booking experience with live Hostaway pricing and a Stripe test card." : "Review the complete stay total, share your details, and securely save your card without leaving Enchanted Havens."}</p>

        <div className="mt-10 border-y border-black/10 py-7">
          <p className="eyebrow mb-5 text-[#805a27]">Step 1 · Your stay</p>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <DateRangePicker listingId={variant.id} checkIn={checkIn} checkOut={checkOut} onChange={updateDates} />
            <GuestCountControl value={guests} onChange={(value) => { setQuote(null); setQuoteSource(null); setError(""); setAppliedCoupon(null); setCouponError(""); setGuests(value) }} max={variant.guests} appearance="stay" ariaLabel="Checkout guests" label="Guests" />
          </div>
          {!hasDates && <p data-testid="checkout-price-prompt" className="mt-5 text-sm leading-7 text-black/48">Select arrival and departure dates to reveal the complete stay total.</p>}
          {hasDates && loading && !quote && <p className="mt-5 flex items-center gap-3 text-sm text-black/48"><LoaderCircle className="size-4 animate-spin text-[#805a27]" /> Calculating the complete stay...</p>}
          {hasDates && !quoteAvailable && <div className="mt-5 border border-[#805a27]/30 bg-[#f3eee3] p-5 text-sm leading-7 text-black/58"><p className="font-semibold text-[#173c33]">Live pricing is temporarily unavailable.</p><p className="mt-1">Send your dates to our stay team and we will confirm availability and the complete total personally.</p><Link href={inquiryHref} className="button-primary mt-5">Send Inquiry <ArrowRight className="size-4" /></Link></div>}
        </div>

        {error && <div role="alert" className="mt-6 border border-[#805a27]/35 bg-[#f3eee3] p-5 text-sm leading-6 text-[#173c33]">{error}</div>}

        {quote && (
          <div className="mt-10">
            <div data-testid="checkout-total" className="flex items-end justify-between gap-5">
              <div><p className="eyebrow text-[#805a27]">Complete Stay Total</p><h2 className="mt-3 font-display text-4xl text-[#173c33]">{quote.nights} {quote.nights === 1 ? "night" : "nights"}</h2></div>
              <div className="text-right"><p className="font-display text-4xl text-[#173c33]">{formatCurrency(quote.total, quote.currency, { cents: true })}</p><p className="mt-1 text-xs text-black/60">{quoteSource === "sandbox" ? "Preview quote" : "Live Hostaway quote"}</p></div>
            </div>
            <div className="mt-6 divide-y divide-black/8 border-y border-black/8">
              {quote.components.filter((component) => component.isIncludedInTotalPrice !== 0 && component.total !== 0).map((component) => <div key={`${component.name}-${component.total}`} className="flex justify-between gap-5 py-3.5 text-sm text-black/58"><span>{component.title}</span><span>{formatCurrency(component.total, quote.currency, { cents: true })}</span></div>)}
            </div>
            <div className="mt-6 border border-[#173c33]/14 bg-[#f3eee3] p-5">
              <div className="flex items-start gap-3"><Tag className="mt-0.5 size-4 shrink-0 text-[#805a27]" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#173c33]">Have a coupon?</p><p className="mt-1 text-xs leading-5 text-black/48">Enter the code from your offer. Discounts apply to accommodation charges; taxes and fees are unchanged.</p></div></div>
              {appliedCoupon ? <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[#63806a]/25 bg-[#e7efe8] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-sm font-bold tracking-[0.08em] text-[#173c33]">{appliedCoupon.code}</p><p className="mt-1 text-xs text-[#43634b]">Applied · You save {formatCurrency(appliedCoupon.discountAmount, quote.currency, { cents: true })}</p></div><button type="button" onClick={() => void removeCoupon()} disabled={loading} className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[#43634b] disabled:opacity-50"><X className="size-3.5" />Remove</button></div> : <div className="mt-4 flex gap-2"><input value={couponInput} onChange={(event) => { setCouponInput(event.target.value.toUpperCase()); setCouponError("") }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void applyCoupon() } }} aria-label="Coupon code" maxLength={24} autoComplete="off" className="min-h-11 min-w-0 flex-1 rounded-lg border border-black/12 bg-white px-4 font-mono text-sm uppercase tracking-[0.08em]" placeholder="COUPON CODE" /><button type="button" onClick={() => void applyCoupon()} disabled={!couponInput.trim() || applyingCoupon} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#173c33] px-5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-45">{applyingCoupon ? "Checking…" : "Apply"}</button></div>}
              {couponError ? <p role="alert" className="mt-3 text-xs leading-5 text-[#8b4032]">{couponError}</p> : null}
            </div>
            <div className="mt-5 flex justify-end"><Link href={inquiryHref} className="inline-flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#173c33]">Prefer personal help? Send Inquiry <ArrowRight className="size-4" /></Link></div>

            {bookingLive && stripePromise ? (
              <Elements stripe={stripePromise} options={{ mode: "setup", currency: "usd", paymentMethodTypes: ["card"], loader: "auto", appearance: { theme: "stripe", variables: { colorPrimary: "#173c33", colorText: "#18221f", colorBackground: "#ffffff", borderRadius: "2px", fontFamily: "Manrope, sans-serif", spacingUnit: "4px" }, rules: { ".Input": { border: "1px solid rgba(23,33,30,.16)", boxShadow: "none", padding: "14px" }, ".Input:focus": { border: "1px solid #805a27", boxShadow: "0 0 0 3px rgba(163,123,67,.1)" }, ".Label": { color: "#6f746f", fontSize: "11px", fontWeight: "600", letterSpacing: ".08em", textTransform: "uppercase" } } } }}>
                <ReservationDetailsForm
                  property={property}
                  variant={variant}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                  guest={guest}
                  setGuest={setGuest}
                  sandboxMode={sandboxMode}
                  couponCode={appliedCoupon?.code}
                  onQuoteReady={(nextQuote, source, coupon) => { setQuote(nextQuote); setQuoteSource(source); setAppliedCoupon(coupon || null) }}
                />
              </Elements>
            ) : (
              <div className="mt-8 border border-[#805a27]/35 bg-[#f3eee3] p-6">
                <div className="flex items-start gap-4"><ShieldCheck className="mt-1 size-5 shrink-0 text-[#805a27]" /><div><p className="font-semibold text-[#173c33]">Personal booking assistance is available.</p><p className="mt-2 text-sm leading-6 text-black/55">Your exact stay total is ready. Send these dates to our team and we will help complete the reservation without sending you to another booking site.</p></div></div>
                <Link href={inquiryHref} className="button-primary mt-6">Send Inquiry <ArrowRight className="size-4" /></Link>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-3 border-t border-black/10 pt-7 text-xs leading-6 text-black/60 sm:grid-cols-3"><p className="flex gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-[#805a27]" /> {quoteSource === "sandbox" ? "Preview availability" : "Live availability verified"}</p><p className="flex gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-[#805a27]" /> Complete total before confirmation</p><p className="flex gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-[#805a27]" /> {sandboxMode ? "No live reservation created" : "No payment collected today"}</p></div>
      </div>

      <aside className="relative hidden h-[calc(100dvh-var(--header-height))] lg:sticky lg:top-[var(--header-height)] lg:block">
        <div className="absolute inset-0"><Image src={variant.images[0]} alt="" fill loading="eager" quality={90} sizes="42vw" className="object-cover" /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#071e19]/88 via-[#071e19]/8 to-transparent" />
        <div className="absolute inset-x-12 bottom-12 text-white"><p className="eyebrow text-[#d4b47d]">{property.eyebrow}</p><p className="display-balance mt-4 font-display text-5xl leading-[0.96]">{property.narrative}</p><div className="mt-7 flex items-center gap-5 border-t border-white/20 pt-5 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-white/58"><span>{variant.guests} guests</span><span>{variant.bedrooms} bedrooms</span><span>{variant.bathrooms} baths</span></div></div>
      </aside>
      {quote && bookingLive && stripePromise ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[#faf7f0]/96 px-4 py-3 shadow-[0_-12px_40px_rgba(7,30,25,.12)] backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-4">
            <div><p className="text-[0.61rem] font-bold uppercase tracking-[0.14em] text-black/55">Complete total</p><p className="mt-1 font-display text-2xl leading-none text-[#173c33]">{formatCurrency(quote.total, quote.currency, { cents: true })}</p></div>
            <a href="#guest-payment" className="button-primary shrink-0">Guest & Payment <ArrowRight className="size-4" /></a>
          </div>
        </div>
      ) : null}
    </div>
  )
}
