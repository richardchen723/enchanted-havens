import { checkoutConfirmSchema, guestSchema, quoteSchema } from "@/lib/schemas"
import { beginConfirmation, getBookingSession, markBookingConfirmed, markBookingError } from "@/lib/booking-sessions"
import { createHostawayReservation, findHostawayReservationByReference, getHostawayQuote, getListingMapId, isListingAvailable } from "@/lib/hostaway"
import { stripe } from "@/lib/stripe"
import { getProperty } from "@/lib/catalog"
import { sendBookingConfirmation } from "@/lib/email"
import { quoteHasChanged } from "@/lib/utils"
import { confirmSandboxBookingSession, getSandboxBookingSession, isSandboxBooking } from "@/lib/sandbox-booking"
import { applyPropertyCoupon, claimCouponRedemption, CouponValidationError } from "@/lib/coupons"

const RECONCILIATION_GRACE_MS = 60_000

export async function POST(request: Request) {
  try {
    const input = checkoutConfirmSchema.parse(await request.json())
    if (isSandboxBooking()) {
      const session = getSandboxBookingSession(input.sessionId)
      if (!session || session.stripeSetupIntentId !== input.setupIntentId) return Response.json({ error: "Sandbox booking session not found." }, { status: 404 })
      if (session.status === "confirmed") return Response.json({ ok: true, confirmationUrl: `/confirmation/${session.id}` })
      if (new Date(session.expiresAt).getTime() < Date.now()) return Response.json({ error: "This sandbox session has expired. Please request a fresh quote." }, { status: 410 })
      const setupIntent = await stripe().setupIntents.retrieve(input.setupIntentId)
      if (setupIntent.status !== "succeeded" || !setupIntent.payment_method) return Response.json({ error: "Your test card has not been verified yet." }, { status: 409 })
      if (setupIntent.customer !== session.stripeCustomerId) return Response.json({ error: "The verified test card does not match this sandbox session." }, { status: 409 })
      const paymentMethodId = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : setupIntent.payment_method.id
      confirmSandboxBookingSession(session.id, paymentMethodId)
      return Response.json({ ok: true, confirmationUrl: `/confirmation/${session.id}`, sandbox: true })
    }
    let session = await getBookingSession(input.sessionId)
    if (!session || session.stripe_setup_intent_id !== input.setupIntentId) return Response.json({ error: "Booking session not found." }, { status: 404 })
    if (session.status === "confirmed") return Response.json({ ok: true, confirmationUrl: `/confirmation/${session.id}` })
    if (session.status === "failed") return Response.json({ error: "This booking request could not be completed. Please begin a new reservation or contact our stay team." }, { status: 409 })
    if (new Date(session.expires_at).getTime() < Date.now()) return Response.json({ error: "This checkout session has expired. Please request a fresh quote." }, { status: 410 })
    const setupIntent = await stripe().setupIntents.retrieve(input.setupIntentId)
    if (setupIntent.status !== "succeeded" || !setupIntent.payment_method) return Response.json({ error: "Your card has not been verified yet." }, { status: 409 })
    if (setupIntent.customer !== session.stripe_customer_id) return Response.json({ error: "The verified card does not match this booking session." }, { status: 409 })
    const paymentMethodId = typeof setupIntent.payment_method === "string" ? setupIntent.payment_method : setupIntent.payment_method.id
    const bookingSessionId = session.id
    const listingId = session.listing_id
    const property = await getProperty(session.property_slug)
    const variant = property?.variants.find((item) => item.id === listingId)
    if (!property || !variant) {
      await markBookingError(session.id, "failed", "Property configuration missing during confirmation")
      return Response.json({ error: "Property configuration is unavailable." }, { status: 500 })
    }
    const guest = guestSchema.parse(session.guest)
    const storedQuote = quoteSchema.parse(session.quote)
    const storedBaseQuote = quoteSchema.parse(session.base_quote || session.quote)
    const finishConfirmation = async (reservationId: number, quote = storedQuote) => {
      const newlyConfirmed = await markBookingConfirmed({ id: bookingSessionId, paymentMethodId, reservationId })
      if (newlyConfirmed) {
        await sendBookingConfirmation({ guest, property, variant, quote, confirmationReference: bookingSessionId }).catch((error) => console.error("Confirmation email failed", error))
      }
      return Response.json({ ok: true, confirmationUrl: `/confirmation/${bookingSessionId}` })
    }

    const reconciliationAge = Date.now() - new Date(session.updated_at).getTime()
    const needsReconciliation = session.status === "reconciliation_required" || session.status === "processing"
    let retryingAfterReconciliation = false
    if (needsReconciliation) {
      if (session.status === "processing" && reconciliationAge < RECONCILIATION_GRACE_MS) {
        return Response.json({ error: "This booking is already being confirmed. Please wait a moment and refresh." }, { status: 409 })
      }
      try {
        const reservation = await findHostawayReservationByReference({
          bookingReference: session.id,
          listingId: session.listing_id,
          checkIn: session.check_in,
          checkOut: session.check_out,
          guestEmail: guest.email,
        })
        if (reservation) return finishConfirmation(reservation.id)
      } catch (error) {
        console.error("Hostaway reservation reconciliation failed", error)
        return Response.json({ error: "We are still verifying this reservation with Hostaway. Your card was not charged. Please wait a moment and try again." }, { status: 502 })
      }
      if (reconciliationAge < RECONCILIATION_GRACE_MS) {
        return Response.json({ error: "We are still verifying this reservation with Hostaway. Your card was not charged. Please wait a moment and try again." }, { status: 409 })
      }
      await markBookingError(session.id, "pending", "No matching Hostaway reservation found during reconciliation; retry permitted")
      retryingAfterReconciliation = true
    }

    let stillAvailable: boolean
    let freshBaseQuote
    try {
      stillAvailable = await isListingAvailable(session.listing_id, session.check_in, session.check_out)
      freshBaseQuote = await getHostawayQuote(session.listing_id, session.check_in, session.check_out, session.guests)
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Hostaway availability verification failed"
      console.error("Hostaway pre-confirmation verification failed", error)
      await markBookingError(session.id, "pending", detail)
      return Response.json({ error: "We could not recheck live availability. Your card was verified but not charged, and no reservation was created. Please try again." }, { status: 502 })
    }
    if (!stillAvailable) {
      if (retryingAfterReconciliation) {
        await markBookingError(session.id, "reconciliation_required", "Hostaway calendar is blocked but no matching reservation was returned")
        return Response.json({ error: "Hostaway is holding these dates while we verify your reservation. Your card was not charged. Please contact our stay team if confirmation does not appear shortly." }, { status: 409 })
      }
      return Response.json({ error: "These dates were just reserved by another guest. Your card was not charged." }, { status: 409 })
    }
    let freshQuote = freshBaseQuote
    if (session.coupon_id && session.coupon_code) {
      try {
        const application = await applyPropertyCoupon({
          propertySlug: session.property_slug,
          code: session.coupon_code,
          quote: freshBaseQuote,
          guestEmail: guest.email,
          bookingSessionId: session.id,
        })
        if (application.coupon.id !== session.coupon_id) throw new CouponValidationError("This coupon is no longer available.")
        freshQuote = application.quote
      } catch (error) {
        if (error instanceof CouponValidationError) {
          await markBookingError(session.id, "pending", error.message)
          return Response.json({ error: error.message }, { status: 409 })
        }
        throw error
      }
    }
    if (quoteHasChanged(storedBaseQuote, freshBaseQuote) || quoteHasChanged(storedQuote, freshQuote)) {
      await markBookingError(session.id, "pending", "Hostaway quote changed before confirmation")
      return Response.json({ error: "The price changed while you were checking out. Review the updated total before confirming.", quote: freshQuote }, { status: 409 })
    }
    const locked = await beginConfirmation(session.id)
    if (!locked) {
      session = await getBookingSession(session.id)
      if (session?.status === "confirmed") return Response.json({ ok: true, confirmationUrl: `/confirmation/${session.id}` })
      return Response.json({ error: "This booking is already being confirmed. Please wait a moment and refresh." }, { status: 409 })
    }
    if (session.coupon_id) {
      try {
        await claimCouponRedemption({
          couponId: session.coupon_id,
          propertySlug: session.property_slug,
          bookingSessionId: session.id,
          guestEmail: guest.email,
          baseQuote: freshBaseQuote,
        })
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Coupon redemption could not be reserved"
        await markBookingError(session.id, "pending", detail)
        return Response.json({ error: error instanceof CouponValidationError ? error.message : "This coupon could not be reserved. Please try again." }, { status: 409 })
      }
    }
    try {
      const listingMapId = await getListingMapId(session.listing_id)
      const reservation = await createHostawayReservation({
        listingMapId,
        checkIn: session.check_in,
        checkOut: session.check_out,
        guests: session.guests,
        guest,
        quote: freshQuote,
        bookingReference: session.id,
        stripeCustomerId: session.stripe_customer_id || undefined,
      })
      const reservationId = Number(reservation.id || reservation.hostawayReservationId)
      if (!Number.isFinite(reservationId)) throw new Error("Hostaway returned a reservation without an ID")
      return finishConfirmation(reservationId, freshQuote)
    } catch (error) {
      await markBookingError(session.id, "reconciliation_required", error instanceof Error ? error.message : "Hostaway confirmation outcome is uncertain")
      return Response.json({ error: "We could not verify the Hostaway reservation outcome. Your card was not charged and our team must reconcile this request before it is retried." }, { status: 502 })
    }
  } catch (error) {
    console.error("Checkout confirmation failed", error)
    return Response.json({ error: error instanceof Error ? error.message : "Unable to confirm this booking." }, { status: 400 })
  }
}
