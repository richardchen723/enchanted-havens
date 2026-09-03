"use client"

import Link from "next/link"
import { AlertTriangle, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react"
import { useRef, useState, type FormEvent } from "react"

type FailureReason = "expired" | "invalid" | "used"

const errorCopy: Record<FailureReason, string> = {
  expired: "This link has expired. Request a fresh sign-in email and use it within 20 minutes.",
  invalid: "This link is not valid. Request a fresh sign-in email to continue.",
  used: "This link has already signed you in. Open the dashboard, or request a fresh link if your session is no longer available.",
}

function isFailureReason(value: unknown): value is FailureReason {
  return value === "expired" || value === "invalid" || value === "used"
}

export function AdminAccessConfirmation({ token }: { token: string }) {
  const submitting = useRef(false)
  const [isPending, setIsPending] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; tone: "error" | "success" } | null>(null)

  async function confirmAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return

    submitting.current = true
    setIsPending(true)
    setFeedback(null)

    try {
      const response = await fetch("/admin/auth/verify/complete", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token }).toString(),
      })
      const payload = await response.json() as { ok?: boolean; reason?: unknown; redirectTo?: unknown }

      if (response.ok && payload.ok) {
        setFeedback({ message: "You’re signed in. Opening the dashboard…", tone: "success" })
        window.location.replace(payload.redirectTo === "/admin/dashboard?welcome=1" ? payload.redirectTo : "/admin/dashboard")
        return
      }

      const reason = isFailureReason(payload.reason) ? payload.reason : "invalid"
      setFeedback({ message: errorCopy[reason], tone: "error" })
    } catch {
      setFeedback({ message: "We could not finish signing you in. Check your connection and try once more.", tone: "error" })
    }

    submitting.current = false
    setIsPending(false)
  }

  return (
    <form action="/admin/auth/verify/complete" method="post" onSubmit={confirmAccess} className="mt-7">
      <input type="hidden" name="token" value={token} />
      <button type="submit" disabled={isPending} className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-[#173c33] px-5 text-xs font-bold uppercase tracking-[0.13em] text-white transition hover:bg-[#0b2922] disabled:cursor-wait disabled:opacity-70">
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {isPending ? "Signing you in…" : "Continue to dashboard"}
        {!isPending ? <ArrowRight className="size-4" /> : null}
      </button>
      <div aria-live="polite">
        {feedback ? (
          <div className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${feedback.tone === "success" ? "border-[#63806a]/22 bg-[#e7efe8] text-[#36533e]" : "border-[#a86e3d]/20 bg-[#f7eee4] text-[#6e482c]"}`}>
            <p className="flex gap-2">
              {feedback.tone === "success" ? <CheckCircle2 className="mt-1 size-4 shrink-0" /> : <AlertTriangle className="mt-1 size-4 shrink-0" />}
              <span>{feedback.message}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-[0.1em]">
              <Link href="/admin/dashboard">Open dashboard</Link>
              {feedback.tone === "error" ? <Link href="/admin/login">Request a new link</Link> : null}
            </div>
          </div>
        ) : null}
      </div>
    </form>
  )
}
