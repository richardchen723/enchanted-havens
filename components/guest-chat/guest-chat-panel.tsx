"use client"

import Link from "next/link"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState } from "react"
import { LoaderCircle, Mail, MessageCircle, Phone, RefreshCw, Send, X } from "lucide-react"
import { BRAND_CONTACT_PHONE, BRAND_CONTACT_PHONE_DISPLAY } from "@/lib/brand"
import { formatUsPhoneInput } from "@/lib/phone"
import { trackConversionEvent } from "@/lib/analytics"
import {
  classifyGuestChatConnectionError,
  getGuestChatErrorStatus,
  GuestChatRequestError,
  GUEST_CHAT_REQUEST_TIMEOUT_MS,
  isRetryableGuestChatError,
  retryGuestChatRequest,
} from "@/lib/chat-connection"
import { GUEST_CHAT_SENDER_LABEL } from "@/lib/guest-chat-utils"
import type {
  CreateGuestChatThreadInput,
  GuestChatContext,
  GuestChatIntent,
  GuestChatMessage,
  GuestChatThreadDetail,
} from "@/types/guest-chat"

const intentOptions: Array<{ value: GuestChatIntent; label: string }> = [
  { value: "availability", label: "Availability" },
  { value: "haven_question", label: "Haven question" },
  { value: "special_request", label: "Special request" },
  { value: "general", label: "General question" },
]

const CHAT_RECONNECT_FAILED_MESSAGE = "We couldn’t reconnect. Check your connection and try again—we’ll keep checking automatically."

type ChatConnectionAction = "load" | "start" | "send"

function reportChatConnectionIssue(
  action: ChatConnectionAction,
  error: unknown,
  details: { attempt?: number; maxAttempts?: number; willRetry?: boolean } = {},
) {
  const online = typeof navigator === "undefined" ? true : navigator.onLine
  const reason = classifyGuestChatConnectionError(error, online)
  const status = getGuestChatErrorStatus(error)
  const diagnostic = {
    action,
    reason,
    online,
    visibility: typeof document === "undefined" ? "unknown" : document.visibilityState,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorMessage: error instanceof Error ? error.message : "Unknown error",
    ...(status === null ? {} : { status }),
    ...details,
  }

  console.warn("[guest-chat] Connection attempt failed", diagnostic)
  trackConversionEvent(details.willRetry ? "Chat Connection Retry" : "Chat Connection Unavailable", {
    action,
    reason,
    online,
    ...(status === null ? {} : { status }),
    ...(details.attempt ? { attempt: details.attempt } : {}),
    ...(details.maxAttempts ? { maxAttempts: details.maxAttempts } : {}),
  })
}

function friendlyChatActionError(error: unknown, action: Exclude<ChatConnectionAction, "load">) {
  const status = getGuestChatErrorStatus(error)
  if (status !== null && status < 500 && status !== 408 && status !== 429) {
    return error instanceof Error ? error.message : "We couldn’t complete that request. Please try again."
  }
  return action === "start"
    ? "We couldn’t connect to start the chat. Check your connection and try again."
    : "We couldn’t connect to send your message. Your message is still here—please try again."
}

async function fetchGuestChatThread() {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), GUEST_CHAT_REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch("/api/chat/thread", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
    if (response.status === 404) return { response, data: null }

    const data = await response.json().catch(() => null)
    if (!response.ok) throw new GuestChatRequestError(data?.error || "Chat is currently unavailable", response.status)
    return { response, data }
  } finally {
    window.clearTimeout(timeout)
  }
}

type GuestChatPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  thread: GuestChatThreadDetail | null
  onThreadChange: (thread: GuestChatThreadDetail | null) => void
  context?: Partial<GuestChatContext> | null
  initialIntent?: GuestChatIntent
  smsFallbackEnabled: boolean
}

function mergeContext(base: Partial<GuestChatContext> | null, next: Partial<GuestChatContext> | null) {
  const merged = { ...(base || {}), ...(next || {}) }
  return Object.values(merged).some((value) => value !== null && value !== undefined && value !== "") ? merged : null
}

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
}

function countStaffMessages(thread: GuestChatThreadDetail | null) {
  return thread?.messages.filter((message) => message.authorType === "staff").length || 0
}

function SystemMessage({ message }: { message: GuestChatMessage }) {
  return (
    <div className="mx-auto max-w-[94%] border border-[#805a27]/18 bg-[#f3eee3] px-4 py-3 text-sm text-[#173c33]">
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-[#805a27]">{GUEST_CHAT_SENDER_LABEL}</p>
      <p className="mt-2 whitespace-pre-wrap leading-6">{message.body}</p>
      <p className="mt-2 text-[0.65rem] text-black/40">{formatMessageTime(message.createdAt)}</p>
    </div>
  )
}

export function GuestChatPanel({
  open,
  onOpenChange,
  thread,
  onThreadChange,
  context,
  initialIntent = "general",
  smsFallbackEnabled,
}: GuestChatPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [isUnavailable, setIsUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIntent, setSelectedIntent] = useState<GuestChatIntent>(initialIntent)
  const [guestName, setGuestName] = useState(thread?.guestName || "")
  const [guestPhone, setGuestPhone] = useState(thread?.guestPhone ? formatUsPhoneInput(thread.guestPhone) : "")
  const [draftMessage, setDraftMessage] = useState("")
  const panelRef = useRef<HTMLDivElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const previousStaffMessageCount = useRef(countStaffMessages(thread))
  const visibleLoadInFlightRef = useRef(false)

  const loadThread = useCallback(async (silent = false) => {
    if (visibleLoadInFlightRef.current) return
    if (!silent) {
      visibleLoadInFlightRef.current = true
      setIsLoading(true)
      setIsReconnecting(false)
      setIsUnavailable(false)
      setError(null)
    }
    try {
      const result = await retryGuestChatRequest(fetchGuestChatThread, {
        retryDelaysMs: silent ? [] : undefined,
        onFailure: ({ attempt, error: loadError, maxAttempts, willRetry }) => {
          if (silent) return
          reportChatConnectionIssue("load", loadError, { attempt, maxAttempts, willRetry })
          setIsLoading(false)
          setIsReconnecting(willRetry)
        },
      })
      const { response, data } = result.value
      if (response.status === 404) {
        previousStaffMessageCount.current = 0
        onThreadChange(null)
        if (result.attempts > 1 && !silent) trackConversionEvent("Chat Connection Recovered", { attempts: result.attempts })
        setIsReconnecting(false)
        setIsUnavailable(false)
        setError(null)
        return
      }
      const nextThread = (data.thread || null) as GuestChatThreadDetail | null
      const staffCount = countStaffMessages(nextThread)
      if (nextThread && previousStaffMessageCount.current > 0 && staffCount > previousStaffMessageCount.current) {
        trackConversionEvent("Chat Reply Received", { threadId: nextThread.id })
      }
      previousStaffMessageCount.current = staffCount
      onThreadChange(nextThread)
      if (result.attempts > 1 && !silent) trackConversionEvent("Chat Connection Recovered", { attempts: result.attempts })
      setIsReconnecting(false)
      setIsUnavailable(false)
      setError(null)
    } catch {
      if (!silent) {
        setIsReconnecting(false)
        setIsUnavailable(true)
        setError(CHAT_RECONNECT_FAILED_MESSAGE)
      }
    } finally {
      if (!silent) {
        visibleLoadInFlightRef.current = false
        setIsLoading(false)
      }
    }
  }, [onThreadChange])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => void loadThread(), 0)
    return () => window.clearTimeout(timer)
  }, [loadThread, open])

  useEffect(() => {
    if (!open) return
    const interval = window.setInterval(() => void loadThread(true), 10_000)
    return () => window.clearInterval(interval)
  }, [loadThread, open])

  useEffect(() => {
    if (!open) return
    const handleOnline = () => void loadThread()
    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [loadThread, open])

  useEffect(() => {
    if (!open || !thread?.id) return
    const sendPresence = (state: "open" | "heartbeat" | "closed", beacon = false) => {
      const payload = JSON.stringify({ state })
      if (beacon && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/chat/thread/presence", new Blob([payload], { type: "application/json" }))
        return
      }
      void fetch("/api/chat/thread/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: payload,
        keepalive: state === "closed",
      }).catch(() => undefined)
    }
    sendPresence("open")
    const heartbeat = window.setInterval(() => sendPresence("heartbeat"), 10_000)
    const handlePageHide = () => sendPresence("closed", true)
    window.addEventListener("pagehide", handlePageHide)
    return () => {
      window.clearInterval(heartbeat)
      window.removeEventListener("pagehide", handlePageHide)
      sendPresence("closed", true)
    }
  }, [open, thread?.id])

  useEffect(() => {
    if (!open || !thread?.guestUnreadCount) return
    void fetch("/api/chat/thread/read", { method: "POST", credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.thread) onThreadChange(data.thread) })
      .catch(() => undefined)
  }, [onThreadChange, open, thread?.guestUnreadCount])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }))
    const isolated = [document.querySelector("header"), document.getElementById("main-content"), document.querySelector("footer")]
      .filter((element): element is HTMLElement => element instanceof HTMLElement)
    isolated.forEach((element) => element.setAttribute("inert", ""))
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false)
      if (event.key !== "Tab" || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault(); focusable.at(-1)?.focus()
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault(); focusable[0].focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      isolated.forEach((element) => element.removeAttribute("inert"))
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onOpenChange, open])

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" })
  }, [thread?.messages.length])

  async function createThread() {
    const message = draftMessage.trim()
    if (!guestName.trim() || !guestPhone.trim() || !message) {
      setError("Please add your name, phone number, and message.")
      return
    }
    setIsSubmitting(true)
    setError(null)
    const payload: CreateGuestChatThreadInput = {
      guestName: guestName.trim(), guestPhone: guestPhone.trim(), message, intent: selectedIntent,
      context: mergeContext(thread?.context || null, context || null) || undefined,
    }
    try {
      const response = await fetch("/api/chat/thread", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new GuestChatRequestError(data?.error || "Failed to start chat", response.status)
      onThreadChange(data.thread)
      previousStaffMessageCount.current = countStaffMessages(data.thread)
      setDraftMessage("")
      trackConversionEvent("Chat Started", { threadId: data.thread.id, intent: selectedIntent })
    } catch (submitError) {
      if (isRetryableGuestChatError(submitError)) reportChatConnectionIssue("start", submitError)
      setError(friendlyChatActionError(submitError, "start"))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function sendMessage() {
    const message = draftMessage.trim()
    if (!message) { setError("Please enter a message."); return }
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch("/api/chat/thread/message", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ message, guestPhone: guestPhone.trim() || null, context: context || undefined }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new GuestChatRequestError(data?.error || "Failed to send message", response.status)
      onThreadChange(data.thread)
      previousStaffMessageCount.current = countStaffMessages(data.thread)
      setDraftMessage("")
      trackConversionEvent("Chat Message Sent", { threadId: data.thread.id })
    } catch (submitError) {
      if (isRetryableGuestChatError(submitError)) reportChatConnectionIssue("send", submitError)
      setError(friendlyChatActionError(submitError, "send"))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function startNewConversation() {
    setIsSubmitting(true)
    try {
      await fetch("/api/chat/thread", { method: "DELETE", credentials: "same-origin" })
      onThreadChange(null)
      previousStaffMessageCount.current = 0
      setSelectedIntent("general")
      setDraftMessage("")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open || typeof document === "undefined") return null
  const currentContext = mergeContext(thread?.context || null, context || null)

  return createPortal(
    <>
      <button type="button" aria-label="Close chat" onClick={() => onOpenChange(false)} className="fixed inset-0 z-[110] bg-[#071e19]/55 backdrop-blur-[2px]" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="guest-chat-title" tabIndex={-1}
        className="fixed inset-y-0 right-0 z-[120] flex w-full flex-col bg-[#faf7f0] shadow-[-30px_0_90px_rgba(7,30,25,.25)] sm:w-[28rem] sm:border-l sm:border-[#d4b47d]/25">
        <header className="border-b border-black/10 bg-[#173c33] px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-[#f3eee3]">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#d4b47d]">Personal stay support</p>
              <h2 id="guest-chat-title" className="mt-2 font-display text-3xl leading-none">Chat with Enchanted Havens</h2>
              <p className="mt-3 max-w-sm text-xs leading-5 text-white/66">Message our team here. We&apos;ll make sure you don&apos;t miss our reply.</p>
            </div>
            <button type="button" onClick={() => onOpenChange(false)} aria-label="Close chat" className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white/10"><X className="size-4" /></button>
          </div>
          {thread ? (
            <p className="mt-4 inline-flex border border-[#d4b47d]/30 bg-white/8 px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.13em] text-[#d4b47d]">
              {thread.status === "waiting_on_team" ? "Waiting on our team" : thread.status === "waiting_on_guest" ? "Waiting on you" : "Conversation closed"}
            </p>
          ) : null}
          {currentContext ? (
            <div className="mt-4 border-l-2 border-[#d4b47d] pl-3 text-xs leading-5 text-white/72">
              <p className="font-semibold text-white">{currentContext.havenName || currentContext.listingSlug || "General inquiry"}</p>
              <p>{currentContext.checkIn && currentContext.checkOut ? `${currentContext.checkIn} to ${currentContext.checkOut}` : "No stay dates selected yet"}{currentContext.guests ? ` · ${currentContext.guests} guest${currentContext.guests === 1 ? "" : "s"}` : ""}</p>
            </div>
          ) : null}
        </header>

        {isLoading ? (
          <div className="grid flex-1 place-items-center"><LoaderCircle className="size-6 animate-spin text-[#805a27]" /></div>
        ) : thread ? (
          <>
            <div ref={transcriptRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
              {thread.messages.map((message) => message.authorType === "system" ? <SystemMessage key={message.id} message={message} /> : (
                <div key={message.id} className={`flex ${message.authorType === "guest" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[86%] px-4 py-3 text-sm ${message.authorType === "guest" ? "bg-[#173c33] text-white" : "border border-black/10 bg-white text-[#173c33]"}`}>
                    {message.authorType === "staff" ? <p className="mb-1 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#805a27]">{GUEST_CHAT_SENDER_LABEL}</p> : null}
                    <p className="whitespace-pre-wrap leading-6">{message.body}</p>
                    <p className={`mt-2 text-[0.62rem] ${message.authorType === "guest" ? "text-white/55" : "text-black/40"}`}>{formatMessageTime(message.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-black/10 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {thread.status === "closed" || thread.status === "spam" ? (
                <div>
                  <p className="text-sm font-semibold text-[#173c33]">This conversation is closed.</p>
                  <button type="button" onClick={() => void startNewConversation()} disabled={isSubmitting} className="button-primary mt-3 w-full justify-center">Start new conversation</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <textarea value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} rows={3} maxLength={4000} placeholder="Write your message..." className="field min-h-24 resize-none" />
                  <button type="button" onClick={() => void sendMessage()} disabled={isSubmitting} aria-label="Send message" className="grid w-14 shrink-0 place-items-center bg-[#173c33] text-white transition hover:bg-[#071e19] disabled:opacity-50">{isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}</button>
                </div>
              )}
            </div>
          </>
        ) : isReconnecting ? (
          <div className="grid flex-1 place-items-center p-5" role="status" aria-live="polite">
            <div className="max-w-sm border border-[#805a27]/20 bg-[#f3eee3] p-6 text-center text-[#173c33]">
              <LoaderCircle className="mx-auto size-6 animate-spin text-[#805a27]" />
              <p className="mt-4 font-semibold">Reconnecting…</p>
              <p className="mt-2 text-xs leading-5 text-black/60">We’re restoring your chat connection. Personal stay support remains available 24/7.</p>
            </div>
          </div>
        ) : isUnavailable ? (
          <div className="flex flex-1 flex-col justify-between p-5">
            <div className="border border-[#805a27]/25 bg-[#f3eee3] p-5 text-sm leading-6 text-[#173c33]"><strong>Chat is temporarily unavailable.</strong><p className="mt-2 text-black/60">You can still reach us directly and we&apos;ll help with your stay.</p></div>
            <div className="grid gap-3">
              <a href={`tel:${BRAND_CONTACT_PHONE}`} className="button-primary justify-center"><Phone className="size-4" /> Call {BRAND_CONTACT_PHONE_DISPLAY}</a>
              <Link href="/contact" className="button-outline justify-center text-[#173c33]"><Mail className="size-4" /> Open contact form</Link>
              <button type="button" onClick={() => void loadThread()} className="inline-flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#805a27]"><RefreshCw className="size-4" /> Retry chat</button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              <div className="border border-[#805a27]/18 bg-[#f3eee3] p-4">
                <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#173c33] text-[#d4b47d]"><MessageCircle className="size-4" /></span><div><p className="font-semibold text-[#173c33]">Welcome to Enchanted Havens</p><p className="mt-1 text-xs leading-5 text-black/58">One of our team members will reply here shortly. You can keep browsing{smsFallbackEnabled ? "—we’ll text a brief Enchanted Havens confirmation, plus any reply you miss after leaving the chat." : " and return to this chat whenever you’re ready."}</p></div></div>
              </div>
              <fieldset><legend className="text-sm font-semibold text-[#173c33]">What can we help with?</legend><div className="mt-3 flex flex-wrap gap-2">{intentOptions.map((option) => <button key={option.value} type="button" onClick={() => setSelectedIntent(option.value)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${selectedIntent === option.value ? "border-[#173c33] bg-[#173c33] text-white" : "border-black/12 bg-white text-[#173c33] hover:border-[#805a27]"}`}>{option.label}</button>)}</div></fieldset>
              <label className="block"><span className="eyebrow mb-2 block text-black/60">Your name</span><input className="field" autoComplete="name" value={guestName} onChange={(event) => setGuestName(event.target.value)} /></label>
              <label className="block"><span className="eyebrow mb-2 block text-black/60">Phone number</span><input className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="(360) 555-1234" value={guestPhone} onChange={(event) => setGuestPhone(formatUsPhoneInput(event.target.value))} /></label>
              <label className="block"><span className="eyebrow mb-2 block text-black/60">How can we help?</span><textarea className="field min-h-32 resize-y" rows={5} maxLength={4000} value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} placeholder="Tell us about your trip, preferred haven, or question..." /></label>
            </div>
            <div className="border-t border-black/10 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => void createThread()} disabled={isSubmitting} className="button-primary w-full justify-center">{isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <MessageCircle className="size-4" />} {isSubmitting ? "Starting chat..." : "Start web chat"}</button>
              <p className="mt-3 text-center text-[0.63rem] leading-5 text-black/45">{smsFallbackEnabled ? "By starting chat, you agree that Enchanted Havens may text this number with an inquiry confirmation and any reply you miss. Message and data rates may apply. Reply STOP to opt out." : "We use your information only to respond to this inquiry."}</p>
            </div>
          </div>
        )}
        {isReconnecting && thread ? <div role="status" aria-live="polite" className="flex items-center gap-2 border-t border-[#805a27]/20 bg-[#f3eee3] px-5 py-3 text-xs leading-5 text-[#173c33]"><LoaderCircle className="size-4 animate-spin text-[#805a27]" /> Reconnecting…</div> : null}
        {error ? <div role="alert" className="border-t border-[#a4452f]/20 bg-[#fff1ed] px-5 py-3 text-xs leading-5 text-[#8a3321]">{error}</div> : null}
      </div>
    </>,
    document.body,
  )
}
