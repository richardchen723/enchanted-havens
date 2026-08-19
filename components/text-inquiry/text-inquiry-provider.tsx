"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { GuestChatPanel } from "@/components/guest-chat/guest-chat-panel"
import { trackConversionEvent } from "@/lib/analytics"
import { inferTextInquiryListing } from "@/lib/text-inquiry-listings"
import type { GuestChatContext, GuestChatIntent, GuestChatThreadDetail } from "@/types/guest-chat"

export type TextInquiryContext = Partial<GuestChatContext>

type TextInquiryContextValue = {
  openTextInquiry: (context?: TextInquiryContext, initialIntent?: GuestChatIntent) => void
  setLauncherSuppressed: (source: string, suppressed: boolean) => void
  chatEnabled: boolean
  textMessagingEnabled: boolean
}

const TextInquiryContextObject = createContext<TextInquiryContextValue | null>(null)

function getSourceType(pathname: string) {
  if (pathname.startsWith("/havens/") || pathname.startsWith("/stays/")) return "stay_page"
  if (pathname === "/contact") return "contact_page"
  if (pathname === "/") return "home_page"
  return "site_page"
}

export function TextInquiryProvider({
  children,
  enabled,
  smsFallbackEnabled,
}: {
  children: React.ReactNode
  enabled: boolean
  smsFallbackEnabled: boolean
}) {
  const pathname = usePathname() || "/"
  const [open, setOpen] = useState(false)
  const [chatContext, setChatContext] = useState<TextInquiryContext | null>(null)
  const [chatIntent, setChatIntent] = useState<GuestChatIntent>("general")
  const [thread, setThread] = useState<GuestChatThreadDetail | null>(null)
  const [launcherSuppressions, setLauncherSuppressions] = useState<Set<string>>(() => new Set())

  const setLauncherSuppressed = useCallback((source: string, suppressed: boolean) => {
    setLauncherSuppressions((current) => {
      const next = new Set(current)
      if (suppressed) next.add(source)
      else next.delete(source)
      return next
    })
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    void fetch("/api/chat/thread", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => { if (!cancelled) setThread(data?.thread || null) })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [enabled])

  function openTextInquiry(context: TextInquiryContext = {}, initialIntent: GuestChatIntent = "general") {
    if (!enabled) return
    const inferred = inferTextInquiryListing(pathname)
    setChatContext({
      ...(thread?.context || {}),
      sourcePath: pathname,
      sourceType: getSourceType(pathname),
      ...(inferred ? { listingSlug: inferred.listingSlug, havenName: inferred.name } : {}),
      ...context,
    })
    setChatIntent(initialIntent)
    setOpen(true)
    trackConversionEvent("Chat Opened", { sourcePath: pathname })
  }

  const unreadCount = thread?.guestUnreadCount || 0
  const launcherSuppressed = launcherSuppressions.size > 0

  return (
    <TextInquiryContextObject.Provider value={{
      openTextInquiry,
      setLauncherSuppressed,
      chatEnabled: enabled,
      textMessagingEnabled: smsFallbackEnabled,
    }}>
      {children}
      {enabled ? (
        <>
          {!open && !launcherSuppressed ? (
            <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-[90] sm:right-6 lg:bottom-6">
              <button
                type="button"
                data-testid="guest-chat-launcher"
                onClick={() => openTextInquiry()}
                className="group relative grid size-12 place-items-center rounded-full border border-[#d4b47d]/35 bg-[#173c33] text-[#d4b47d] shadow-[0_18px_45px_rgba(7,30,25,.3)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#071e19] sm:flex sm:size-auto sm:gap-3 sm:rounded-none sm:px-5 sm:py-3 sm:text-left"
                aria-label={thread ? "Open your chat with Enchanted Havens" : "Chat with Enchanted Havens"}
              >
                <span className="grid size-10 place-items-center rounded-full border border-[#d4b47d]/45 bg-white/8 transition group-hover:bg-white/12">
                  <MessageCircle className="size-4" aria-hidden="true" />
                </span>
                <span className="hidden sm:block">
                  <span className="block text-[0.58rem] font-bold uppercase tracking-[0.2em] text-[#d4b47d]">{thread ? "Welcome back" : "Questions?"}</span>
                  <span className="mt-0.5 block font-display text-xl leading-none text-[#f3eee3]">Chat with us</span>
                </span>
                {unreadCount > 0 ? <span className="absolute -right-1 -top-1 grid min-h-6 min-w-6 place-items-center rounded-full bg-[#f3eee3] px-1 text-xs font-bold text-[#173c33]">{unreadCount}</span> : null}
              </button>
            </div>
          ) : null}
          {open ? (
            <GuestChatPanel
              open
              onOpenChange={setOpen}
              thread={thread}
              onThreadChange={setThread}
              context={chatContext}
              initialIntent={chatIntent}
              smsFallbackEnabled={smsFallbackEnabled}
            />
          ) : null}
        </>
      ) : null}
    </TextInquiryContextObject.Provider>
  )
}

export function useTextInquiry() {
  const context = useContext(TextInquiryContextObject)
  if (!context) throw new Error("useTextInquiry must be used within TextInquiryProvider")
  return context
}
