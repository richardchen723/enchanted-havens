import { checkoutSetupSchema, type Guest, type Quote } from "@/lib/schemas"
import { bookingIsLiveFor, getProperty } from "@/lib/catalog"
import { getHostawayQuote, isHostawayConfigured, isListingAvailable } from "@/lib/hostaway"
import { stripe } from "@/lib/stripe"
import { createBookingSession } from "@/lib/booking-sessions"
import { createSandboxBookingSession, getSandboxQuote, isSandboxBooking } from "@/lib/sandbox-booking"

function getCustomerAddress(guest: Guest) {
  if (!guest.address && !guest.city && !guest.state && !guest.zipCode) return undefined
  return {
    line1: guest.address || undefined,
    city: guest.city || undefined,
    state: guest.state || undefined,
    postal_code: guest.zipCode || undefined,
    country: guest.country,
  }
}

export async function POST(request: Request) {
  try {
    const input = checkoutSetupSchema.parse(await request.json())
    const property = await getProperty(input.propertySlug)
    const variant = property?.variants.find((item) => item.slug === input.variantSlug && item.id === input.listingId)
    if (!property || !variant) return Response.json({ error: "This haven is not available for direct booking." }, { status: 404 })
    if (!bookingIsLiveFor(variant.id)) return Response.json({ error: "Secure direct checkout is temporarily unavailable. Please send an inquiry and our stay team will help complete the reservation." }, { status: 503 })
    if (isSandboxBooking()) {
      let source: "hostaway" | "sandbox" = "sandbox"
      let quote: Quote
      if (isHostawayConfigured()) {
        const available = await isListingAvailable(variant.id, input.checkIn, input.checkOut)
        if (!available) return Response.json({ error: "The selected dates are no longer available." }, { status: 409 })
        quote = await getHostawayQuote(variant.id, input.checkIn, input.checkOut, input.guests)
        source = "hostaway"
      } else {
        quote = getSandboxQuote(variant.id, input.checkIn, input.checkOut, input.guests)
      }
      const customer = await stripe().customers.create({
        email: input.guest.email,
        name: `${input.guest.firstName} ${input.guest.lastName}`,
        phone: input.guest.phone,
        address: getCustomerAddress(input.guest),
        metadata: { source: "enchanted-havens-sandbox", environment: "test-only" },
      })
      const setupIntent = await stripe().setupIntents.create({
        customer: customer.id,
        usage: "off_session",
        payment_method_types: ["card"],
        metadata: { mode: "sandbox", listingId: String(variant.id), propertySlug: property.slug, variantSlug: variant.slug },
      })
      if (!setupIntent.client_secret) throw new Error("Stripe did not return a checkout secret")
      const session = createSandboxBookingSession({ propertySlug: property.slug, variantSlug: variant.slug, listingId: variant.id, checkIn: input.checkIn, checkOut: input.checkOut, guests: input.guests, guest: input.guest, quote, stripeCustomerId: customer.id, stripeSetupIntentId: setupIntent.id })
      return Response.json({ sessionId: session.id, expiresAt: session.expiresAt, clientSecret: setupIntent.client_secret, quote, source, sandboxWrites: true })
    }
    const available = await isListingAvailable(variant.id, input.checkIn, input.checkOut)
    if (!available) return Response.json({ error: "The selected dates are no longer available." }, { status: 409 })
    const quote = await getHostawayQuote(variant.id, input.checkIn, input.checkOut, input.guests)
    const customer = await stripe().customers.create({
      email: input.guest.email,
      name: `${input.guest.firstName} ${input.guest.lastName}`,
      phone: input.guest.phone,
      address: getCustomerAddress(input.guest),
      metadata: { source: "enchanted-havens-direct" },
    })
    const setupIntent = await stripe().setupIntents.create({
      customer: customer.id,
      usage: "off_session",
      payment_method_types: ["card"],
      metadata: { listingId: String(variant.id), propertySlug: property.slug, variantSlug: variant.slug, checkIn: input.checkIn, checkOut: input.checkOut },
    })
    if (!setupIntent.client_secret) throw new Error("Stripe did not return a checkout secret")
    const session = await createBookingSession({
      propertySlug: property.slug,
      variantSlug: variant.slug,
      listingId: variant.id,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      guest: input.guest,
      quote,
      stripeCustomerId: customer.id,
      stripeSetupIntentId: setupIntent.id,
    })
    return Response.json({ sessionId: session.id, expiresAt: session.expiresAt, clientSecret: setupIntent.client_secret, quote, source: "hostaway" })
  } catch (error) {
    console.error("Checkout setup failed", error)
    return Response.json({ error: error instanceof Error ? error.message : "Unable to start secure checkout." }, { status: 400 })
  }
}
