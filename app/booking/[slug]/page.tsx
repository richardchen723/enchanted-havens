import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { BookingCheckout } from "@/components/booking-checkout"
import { bookingIsLiveFor, getProperty } from "@/lib/catalog"
import { isHostawayConfigured } from "@/lib/hostaway"
import { isSandboxBooking } from "@/lib/sandbox-booking"

export const metadata: Metadata = { title: "Secure Reservation", robots: { index: false, follow: false } }

export default async function BookingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params
  const query = await searchParams
  const property = await getProperty(slug)
  if (!property) notFound()
  const variantSlug = typeof query.variant === "string" ? query.variant : undefined
  const variant = property.variants.find((item) => item.slug === variantSlug) || property.variants[0]
  const sandboxMode = isSandboxBooking()
  const bookingLive = bookingIsLiveFor(variant.id)
  if (!bookingLive) {
    const contactParams = new URLSearchParams({ property: property.slug, variant: variant.slug })
    if (typeof query.checkIn === "string") contactParams.set("checkIn", query.checkIn)
    if (typeof query.checkOut === "string") contactParams.set("checkOut", query.checkOut)
    if (typeof query.guests === "string") contactParams.set("guests", query.guests)
    redirect(`/contact?${contactParams.toString()}`)
  }
  return <BookingCheckout property={property} variant={variant} initialCheckIn={typeof query.checkIn === "string" ? query.checkIn : ""} initialCheckOut={typeof query.checkOut === "string" ? query.checkOut : ""} initialGuests={typeof query.guests === "string" ? Number(query.guests) || 2 : 2} bookingLive={bookingLive} quoteAvailable={isHostawayConfigured() || sandboxMode} sandboxMode={sandboxMode} publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY} />
}
