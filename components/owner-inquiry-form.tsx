"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react"
import { trackConversionEvent } from "@/lib/analytics"

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
    const details = Object.fromEntries(new FormData(event.currentTarget))
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
      <p className="text-sm text-black/65">Three details to begin. No exact address needed.</p>
      <label htmlFor="owner-name"><span className="mb-2 block text-sm text-[#173c33]">Name <span aria-hidden="true">*</span></span><input id="owner-name" className="field text-base" name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
      <label htmlFor="owner-email"><span className="mb-2 block text-sm text-[#173c33]">Email <span aria-hidden="true">*</span></span><input id="owner-email" className="field text-base" name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label htmlFor="owner-location"><span className="mb-2 block text-sm text-[#173c33]">Property location <span aria-hidden="true">*</span></span><input id="owner-location" className="field text-base" name="propertyLocation" placeholder="Town or area" required minLength={2} maxLength={300} aria-describedby="owner-location-help" /><span id="owner-location-help" className="mt-2 block text-xs leading-6 text-black/60">For example, Port Angeles, Belfair, or Oak Harbor.</span></label>
      <details className="border-y border-[#173c33]/15 py-4"><summary className="cursor-pointer text-sm leading-7 text-[#173c33]">Add a phone number or a note (optional)</summary><div className="mt-5 grid gap-5"><label htmlFor="owner-phone"><span className="mb-2 block text-sm">Phone (optional)</span><input id="owner-phone" className="field text-base" name="phone" type="tel" autoComplete="tel" maxLength={40} /></label><label htmlFor="owner-message"><span className="mb-2 block text-sm">Anything you would like us to know? (optional)</span><textarea id="owner-message" className="field min-h-32 resize-y text-base" name="message" maxLength={4000} placeholder="Your goals, timing, or an existing listing link." /></label></div></details>
      {state === "error" && <p role="alert" className="border-l-2 border-red-800 pl-4 text-sm leading-7 text-red-900">{error}</p>}
      <button type="submit" className="button-primary w-full" disabled={state === "sending"}>{state === "sending" ? <><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Sending inquiry</> : <>Send my inquiry <ArrowRight aria-hidden="true" className="size-4" /></>}</button>
      <p role="status" aria-live="polite" className="sr-only">{state === "sending" ? "Sending your inquiry. Please keep this page open." : ""}</p>
      <p className="text-xs leading-6 text-black/65">We use these details to respond to your inquiry. <Link href="/privacy" className="underline underline-offset-4">Privacy policy</Link>.</p>
    </form>
  )
}
