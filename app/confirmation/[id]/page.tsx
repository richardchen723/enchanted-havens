import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { notFound } from "next/navigation"
import { getBookingSession } from "@/lib/booking-sessions"
import { isDatabaseConfigured } from "@/lib/db"
import { formatCount, formatCurrency } from "@/lib/utils"
import { getSandboxBookingSession, isSandboxBooking } from "@/lib/sandbox-booking"

export const metadata: Metadata = { title: "Reservation Confirmed", robots: { index: false, follow: false } }

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id
  if (isSandboxBooking()) {
    const session = getSandboxBookingSession(id)
    if (!session || session.status !== "confirmed") notFound()
    return <section className="grid min-h-[78dvh] place-items-center bg-[#f3eee3] px-5 py-20"><div className="max-w-2xl text-center"><CheckCircle2 className="mx-auto size-12 text-[#805a27]" /><p className="eyebrow mt-7 text-[#805a27]">Stripe Sandbox Complete</p><h1 className="mt-5 font-display text-6xl leading-[0.9] text-[#173c33] sm:text-7xl">The journey works beautifully.</h1><p className="mt-7 text-lg leading-8 text-black/58">The test card was securely saved in Stripe test mode for an illustrative {session.quote.nights}-night stay.</p><div className="mx-auto mt-9 max-w-md border-y border-black/10 py-6 text-sm"><div className="flex justify-between"><span>Sandbox total</span><strong>{formatCurrency(session.quote.total, session.quote.currency, { cents: true })}</strong></div><div className="mt-3 flex justify-between gap-6"><span>Test reference</span><strong className="break-all text-right">{session.id}</strong></div></div><div className="mt-7 border border-[#805a27]/30 bg-[#faf7f0] p-5 text-sm leading-7 text-black/56"><strong className="text-[#173c33]">No live reservation was created.</strong> Hostaway, email delivery, calendar blocking, and real card charges remained disabled throughout this test.</div><div className="mt-9 flex flex-wrap justify-center gap-3"><Link href="/" className="button-primary">Return Home</Link><Link href="/havens" className="button-outline text-[#173c33]">Explore the Collection</Link></div></div></section>
  }
  if (!isDatabaseConfigured()) notFound()
  const session = await getBookingSession(id)
  if (!session || session.status !== "confirmed") notFound()
  return <section className="grid min-h-[72dvh] place-items-center bg-[#f3eee3] px-5 py-20"><div className="max-w-2xl text-center"><CheckCircle2 className="mx-auto size-12 text-[#805a27]" /><p className="eyebrow mt-7 text-[#805a27]">Reservation Confirmed</p><h1 className="mt-5 font-display text-7xl leading-[0.9] text-[#173c33]">Your haven is waiting.</h1><p className="mt-7 text-lg leading-8 text-black/58">Your stay from {session.check_in} to {session.check_out} is confirmed for {formatCount(session.guests, "guest")}.</p><div className="mx-auto mt-9 max-w-md border-y border-black/10 py-6 text-sm"><div className="flex justify-between"><span>Reservation total</span><strong>{formatCurrency(Number(session.quote.total), session.quote.currency, { cents: true })}</strong></div><div className="mt-3 flex justify-between"><span>Reference</span><strong className="text-right">{session.id}</strong></div></div><p className="mt-7 text-sm leading-7 text-black/52">No payment was collected today. Your card is securely saved, and our guest service team will charge it manually according to the booking terms. A confirmation email is on its way.</p><div className="mt-9 flex flex-wrap justify-center gap-3"><Link href="/" className="button-primary">Return Home</Link><Link href="/contact" className="button-outline text-[#173c33]">Contact the Stay Team</Link></div></div></section>
}
