"use client"

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { ArrowRight, CheckCircle2, ChevronDown, LoaderCircle } from "lucide-react"
import { trackConversionEvent } from "@/lib/analytics"
import { formatUsPhoneInput } from "@/lib/phone"

const subscribeToHydration = () => () => {}
const getClientHydrationState = () => true
const getServerHydrationState = () => false

export function ContactForm({ initialTripType = "", initialMessage = "" }: { initialTripType?: string; initialMessage?: string }) {
  const ready = useSyncExternalStore(subscribeToHydration, getClientHydrationState, getServerHydrationState)
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [message, setMessage] = useState("")
  const [phone, setPhone] = useState("")
  const [reference, setReference] = useState("")
  const successRef = useRef<HTMLDivElement>(null)
  const submissionKeyRef = useRef("")
  useEffect(() => {
    if (state === "sent") successRef.current?.focus()
  }, [state])
  function updatePhone(event: ChangeEvent<HTMLInputElement>) {
    setPhone(formatUsPhoneInput(event.target.value))
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === "sending") return

    const formData = new FormData(event.currentTarget)
    setState("sending")
    setMessage("")
    submissionKeyRef.current ||= crypto.randomUUID()
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(formData), submissionKey: submissionKeyRef.current }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.error || "We could not send your inquiry. Please try again.")
        setState("error")
        return
      }
      setReference(String(data.reference || ""))
      setState("sent")
      trackConversionEvent("Stay Inquiry Sent", { tripType: String(formData.get("tripType") || "Not specified") })
    } catch {
      setMessage("We could not send your inquiry. Please check your connection and try again.")
      setState("error")
    }
  }
  if (state === "sent") return <div ref={successRef} role="status" aria-live="polite" tabIndex={-1} className="border border-[#805a27]/35 bg-[#f3eee3] p-8 outline-none"><CheckCircle2 className="size-8 text-[#805a27]" /><h2 className="mt-5 font-display text-4xl text-[#173c33]">Your note is with us.</h2><p className="mt-3 leading-7 text-black/60">We sent a copy to your email. A member of the Enchanted Havens team will review your trip and reply personally.</p>{reference ? <p className="mt-5 text-sm font-semibold text-[#173c33]">Inquiry reference · {reference}</p> : null}</div>
  return (
    <form onSubmit={submit} aria-busy={state === "sending"} className="grid gap-5">
      <label className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /></label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label><span className="eyebrow mb-2 block text-black/60">Name <span aria-hidden="true" className="text-[#805a27]">*</span></span><input className="field" name="name" autoComplete="name" required /></label>
        <label><span className="eyebrow mb-2 block text-black/60">Email <span aria-hidden="true" className="text-[#805a27]">*</span></span><input className="field" type="email" name="email" autoComplete="email" required /></label>
        <label><span className="eyebrow mb-2 block text-black/60">Phone <span className="normal-case tracking-normal text-black/40">(optional)</span></span><input className="field" type="tel" inputMode="numeric" name="phone" autoComplete="tel-national" placeholder="(770)123-1234" pattern="\(\d{3}\)\d{3}-\d{4}" maxLength={13} value={phone} onChange={updatePhone} /></label>
        <label>
          <span className="eyebrow mb-2 block text-black/60">What brings you here?</span>
          <span className="relative block">
            <select className="field h-[3.6rem] cursor-pointer appearance-none pr-12 text-base" name="tripType" defaultValue={initialTripType}>
              <option value="" disabled>Select one</option>
              <option>Romantic escape</option>
              <option>Family gathering</option>
              <option>Celebration</option>
              <option>The Cove Club</option>
              <option>Help choosing a home</option>
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#805a27]" />
          </span>
        </label>
      </div>
      <label><span className="eyebrow mb-2 block text-black/60">Tell us about the stay <span className="normal-case tracking-normal text-black/40">(optional)</span></span><textarea className="field min-h-40 resize-y" name="message" defaultValue={initialMessage} placeholder="Dates, group size, occasion, and anything that would help us guide you." /></label>
      {state === "error" && <p role="alert" aria-live="assertive" className="text-sm text-red-800">{message}</p>}
      <div className="flex min-h-14 flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          className="button-primary min-w-48 justify-self-start disabled:cursor-wait disabled:opacity-80"
          type="submit"
          disabled={!ready || state === "sending"}
          aria-describedby={state === "sending" ? "inquiry-sending-status" : undefined}
        >
          {state === "sending" ? <><LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Sending Inquiry</> : <>Send Inquiry <ArrowRight className="size-4" /></>}
        </button>
        <p id="inquiry-sending-status" role="status" aria-live="polite" aria-atomic="true" className="text-sm leading-6 text-[#173c33]/70">
          {state === "sending" ? "Sending securely—please keep this page open." : ""}
        </p>
      </div>
    </form>
  )
}
