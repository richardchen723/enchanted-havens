"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react"
import { trackConversionEvent } from "@/lib/analytics"
import { OWNER_PROPERTY_FEATURES } from "@/lib/owner-property-features"

export function OwnerInquiryForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState("")
  const [reference, setReference] = useState("")
  const requestRef = useRef<{ signature: string; key: string; attribution: Record<string, string> } | null>(null)
  const pending = useRef(false)
  const started = useRef(false)
  const statusRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (state === "sent") statusRef.current?.focus() }, [state])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true
    setState("sending")
    setError("")
    const formData = new FormData(event.currentTarget)
    const details = { ...Object.fromEntries(formData), features: formData.getAll("features") }
    const signature = JSON.stringify(details)
    if (!requestRef.current || requestRef.current.signature !== signature) {
      const params = new URLSearchParams(window.location.search)
      let referrerHost = ""
      try { referrerHost = document.referrer ? new URL(document.referrer).hostname : "" } catch { /* Referrer is optional. */ }
      requestRef.current = { signature, key: crypto.randomUUID(), attribution: { utmSource: (params.get("utm_source") || "").slice(0, 120), utmMedium: (params.get("utm_medium") || "").slice(0, 120), utmCampaign: (params.get("utm_campaign") || "").slice(0, 200), referrerHost } }
    }
    try {
      const response = await fetch("/api/owner-inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...details, ...requestRef.current.attribution, submissionKey: requestRef.current.key }) })
      const result = await response.json()
      if (!response.ok || result.ok !== true) throw new Error(result.error || "Your inquiry could not be sent. Please try again or contact our team directly.")
      setReference(String(result.reference || ""))
      setState("sent")
      trackConversionEvent("Owner Inquiry Sent", { intent: "full_service_management", sourcePath: "/vacation-rental-management" })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please check your connection and try again. Your details are still here.")
      setState("error")
      trackConversionEvent("Owner Inquiry Error", { intent: "full_service_management" })
    } finally { pending.current = false }
  }

  if (state === "sent") return <div ref={statusRef} role="status" tabIndex={-1} className="border border-[#173c33]/25 bg-[#faf7f0] p-7 sm:p-10"><CheckCircle2 aria-hidden="true" className="size-7 text-[#805a27]" /><h3 className="mt-5 font-display text-4xl leading-tight text-[#173c33]">Thank you for introducing your home.</h3><p className="mt-4 text-sm leading-7 text-black/70">Our team has received your inquiry and will follow up to discuss your property and goals.</p>{reference && <p className="mt-5 text-sm text-[#173c33]">Your reference: <strong>{reference}</strong></p>}</div>

  return (
    <form action="/api/owner-inquiries" method="post" onSubmit={submit} aria-label="Owner management inquiry" aria-busy={state === "sending"} className="grid gap-5" data-clarity-mask="true" onFocusCapture={() => { if (!started.current) { started.current = true; trackConversionEvent("Owner Inquiry Started", { intent: "full_service_management" }) } }}>
      <div hidden aria-hidden="true"><label>Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <p className="text-sm leading-7 text-black/65">These details help us review your home and its local market before we connect.</p>
      <label htmlFor="owner-name"><span className="mb-2 block text-sm text-[#173c33]">Name <span aria-hidden="true">*</span></span><input id="owner-name" className="field text-base" name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
      <label htmlFor="owner-email"><span className="mb-2 block text-sm text-[#173c33]">Email <span aria-hidden="true">*</span></span><input id="owner-email" className="field text-base" name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <fieldset className="grid min-w-0 gap-5 border-t border-[#173c33]/15 pt-5">
        <legend className="pr-3 text-sm font-medium text-[#173c33]">About your property</legend>
        <label htmlFor="owner-address"><span className="mb-2 block text-sm text-[#173c33]">Property address <span aria-hidden="true">*</span></span><input id="owner-address" className="field text-base" name="propertyAddress" autoComplete="street-address" placeholder="Street address, city, state, ZIP" required minLength={8} maxLength={300} aria-describedby="owner-address-help" /><span id="owner-address-help" className="mt-2 block text-xs leading-6 text-black/60">Include the street address, city, state, and ZIP code.</span></label>
        <div className="grid grid-cols-2 gap-4">
          <label htmlFor="owner-bedrooms"><span className="mb-2 block text-sm text-[#173c33]">Bedrooms <span aria-hidden="true">*</span></span><input id="owner-bedrooms" className="field text-base" name="bedrooms" type="number" inputMode="numeric" min={0} max={50} step={1} required placeholder="e.g. 3" aria-describedby="owner-bedrooms-help" /><span id="owner-bedrooms-help" className="mt-2 block text-xs leading-6 text-black/60">Enter 0 for a studio.</span></label>
          <label htmlFor="owner-bathrooms"><span className="mb-2 block text-sm text-[#173c33]">Bathrooms <span aria-hidden="true">*</span></span><input id="owner-bathrooms" className="field text-base" name="bathrooms" type="number" inputMode="decimal" min={0.5} max={50} step={0.5} required placeholder="e.g. 2.5" aria-describedby="owner-bathrooms-help" /><span id="owner-bathrooms-help" className="mt-2 block text-xs leading-6 text-black/60">Half baths count as 0.5.</span></label>
        </div>
        <fieldset className="min-w-0">
          <legend className="text-sm text-[#173c33]">Property features (optional)</legend>
          <p className="mt-1 text-xs leading-6 text-black/60">Select all that apply.</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">{OWNER_PROPERTY_FEATURES.map((feature) => <label key={feature} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[#173c33]"><input type="checkbox" name="features" value={feature} className="size-4 shrink-0 accent-[#173c33]" />{feature}</label>)}</div>
        </fieldset>
      </fieldset>
      <details className="border-y border-[#173c33]/15 py-4"><summary className="cursor-pointer text-sm leading-7 text-[#173c33]">Add a phone number or a note (optional)</summary><div className="mt-5 grid gap-5"><label htmlFor="owner-phone"><span className="mb-2 block text-sm">Phone (optional)</span><input id="owner-phone" className="field text-base" name="phone" type="tel" autoComplete="tel" maxLength={40} /></label><label htmlFor="owner-message"><span className="mb-2 block text-sm">Anything you would like us to know? (optional)</span><textarea id="owner-message" className="field min-h-32 resize-y text-base" name="message" maxLength={4000} placeholder="Your goals, timing, or an existing listing link." /></label></div></details>
      {state === "error" && <p role="alert" className="border-l-2 border-red-800 pl-4 text-sm leading-7 text-red-900">{error}</p>}
      <button type="submit" className="button-primary w-full" disabled={state === "sending"}>{state === "sending" ? <><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Sending inquiry</> : <>Send my inquiry <ArrowRight aria-hidden="true" className="size-4" /></>}</button>
      <p role="status" aria-live="polite" className="sr-only">{state === "sending" ? "Sending your inquiry. Please keep this page open." : ""}</p>
      <p className="text-xs leading-6 text-black/65">We use these details to respond to your inquiry. <Link href="/privacy" className="underline underline-offset-4">Privacy policy</Link>.</p>
    </form>
  )
}
