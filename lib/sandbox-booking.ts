import { randomUUID } from "node:crypto"
import type { Guest, Quote } from "@/lib/schemas"
import { nightsBetween } from "@/lib/utils"

const nightlyRates: Record<number, number> = {
  146889: 725,
  157299: 895,
  178403: 1150,
  178994: 875,
  184081: 820,
  335403: 795,
  576478: 825,
  558675: 1200,
  558676: 1500,
  558677: 3200,
  558678: 1800,
}

export type SandboxBookingSession = {
  id: string
  status: "pending" | "confirmed"
  propertySlug: string
  variantSlug: string
  listingId: number
  checkIn: string
  checkOut: string
  guests: number
  guest: Guest
  quote: Quote
  stripeCustomerId: string
  stripeSetupIntentId: string
  stripePaymentMethodId: string | null
  expiresAt: string
  confirmedAt: string | null
}

declare global {
  var __enchantedHavensSandboxSessions: Map<string, SandboxBookingSession> | undefined
}

const sessions = globalThis.__enchantedHavensSandboxSessions ??= new Map<string, SandboxBookingSession>()

function money(value: number) {
  return Math.round(value * 100) / 100
}

export function isSandboxBooking() {
  return process.env.BOOKING_WRITE_MODE === "sandbox"
}

export function isStagingBooking() {
  return process.env.BOOKING_WRITE_MODE === "staging"
}

export function isStripeSandboxConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_"),
  )
}

export function isStripeLiveConfigured() {
  return Boolean(
    (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ||
      process.env.STRIPE_SECRET_KEY?.startsWith("rk_live_")) &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_live_"),
  )
}

export function getSandboxQuote(listingId: number, checkIn: string, checkOut: string, guests: number): Quote {
  const nights = nightsBetween(checkIn, checkOut)
  if (nights < 1) throw new Error("Departure must be after arrival.")
  const nightlyRate = nightlyRates[listingId]
  if (!nightlyRate) throw new Error("This haven is not configured for sandbox checkout.")

  const accommodation = money(nightlyRate * nights)
  const cleaning = listingId >= 558675 ? 425 : guests >= 10 ? 325 : 245
  const lodgingTax = money((accommodation + cleaning) * 0.12)
  const total = money(accommodation + cleaning + lodgingTax)

  return {
    listingId,
    checkIn,
    checkOut,
    guests,
    nights,
    total,
    currency: "USD",
    available: true,
    components: [
      { type: "price", name: "sandboxAccommodation", title: `${nights} ${nights === 1 ? "night" : "nights"} at sandbox rate`, value: nightlyRate, total: accommodation, quantity: nights, isIncludedInTotalPrice: 1, isMandatory: 1 },
      { type: "fee", name: "sandboxCleaning", title: "Cleaning fee", value: cleaning, total: cleaning, quantity: 1, isIncludedInTotalPrice: 1, isMandatory: 1 },
      { type: "tax", name: "sandboxLodgingTax", title: "Estimated lodging taxes", value: lodgingTax, total: lodgingTax, quantity: 1, isIncludedInTotalPrice: 1, isMandatory: 1 },
    ],
  }
}

export function createSandboxBookingSession(input: Omit<SandboxBookingSession, "id" | "status" | "stripePaymentMethodId" | "expiresAt" | "confirmedAt">) {
  const session: SandboxBookingSession = {
    ...input,
    id: randomUUID(),
    status: "pending",
    stripePaymentMethodId: null,
    expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    confirmedAt: null,
  }
  sessions.set(session.id, session)
  return session
}

export function getSandboxBookingSession(id: string) {
  return sessions.get(id) || null
}

export function confirmSandboxBookingSession(id: string, paymentMethodId: string) {
  const session = sessions.get(id)
  if (!session) return null
  if (session.status === "confirmed") return session
  const confirmed = { ...session, status: "confirmed" as const, stripePaymentMethodId: paymentMethodId, confirmedAt: new Date().toISOString() }
  sessions.set(id, confirmed)
  return confirmed
}
