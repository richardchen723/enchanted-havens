import { resolve4 } from "node:dns/promises"
import nodemailer from "nodemailer"
import type { Guest, Property, PropertyVariant, Quote } from "@/lib/schemas"
import { formatCurrency } from "@/lib/utils"

export const DEFAULT_CONTACT_TO_EMAIL = "stays@enchantedhavens.com"

export function isEmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

async function googleTransport() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return null
  const smtpServer = "smtp.gmail.com"
  const host = process.env.GMAIL_SMTP_HOST || (await resolve4(smtpServer))[0] || smtpServer

  return {
    from: process.env.BOOKING_FROM_EMAIL || `Enchanted Havens <${user}>`,
    transporter: nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      tls: { servername: smtpServer },
    }),
  }
}

export async function sendBookingConfirmation(input: { guest: Guest; property: Property; variant: PropertyVariant; quote: Quote; confirmationReference: string }) {
  const mail = await googleTransport()
  if (!mail) return
  await mail.transporter.sendMail({
    from: mail.from,
    to: input.guest.email,
    replyTo: process.env.BOOKING_REPLY_TO_EMAIL || DEFAULT_CONTACT_TO_EMAIL,
    subject: `Your ${input.variant.shortName} stay is confirmed`,
    html: `<div style="font-family:Arial,sans-serif;color:#18221f;max-width:640px;margin:auto;padding:36px"><p style="text-transform:uppercase;letter-spacing:.16em;color:#805a27;font-size:12px">Enchanted Havens</p><h1 style="font-family:Georgia,serif;color:#173c33;font-size:44px;font-weight:400">Your haven is confirmed.</h1><p>Dear ${input.guest.firstName},</p><p>We have reserved <strong>${input.variant.shortName}</strong> from ${input.quote.checkIn} to ${input.quote.checkOut} for ${input.quote.guests} guests.</p><p><strong>Reservation total:</strong> ${formatCurrency(input.quote.total, input.quote.currency, { cents: true })}<br/><strong>Reference:</strong> ${input.confirmationReference}</p><p>No payment was collected today. Your card was saved securely in Stripe, and our guest service team will charge it manually according to the approved booking terms.</p><p>We look forward to welcoming you to ${input.property.location}.</p></div>`,
  })
}

type ContactInquiryEmail = { reference: string; name: string; email: string; phone?: string; tripType?: string; message: string }

export async function sendContactNotification(input: ContactInquiryEmail) {
  const mail = await googleTransport()
  if (!mail) return false
  try {
    await mail.transporter.sendMail({
      from: mail.from,
      to: process.env.CONTACT_TO_EMAIL || DEFAULT_CONTACT_TO_EMAIL,
      replyTo: input.email,
      subject: `New stay inquiry ${input.reference} from ${input.name}`,
      text: `Reference: ${input.reference}\nName: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || "Not provided"}\nTrip type: ${input.tripType || "Not provided"}\n\n${input.message}`,
    })
    return true
  } catch {
    throw new Error("The inquiry notification could not be delivered.")
  }
}

export async function sendContactAcknowledgement(input: ContactInquiryEmail) {
  const mail = await googleTransport()
  if (!mail) return false
  await mail.transporter.sendMail({
    from: mail.from,
    to: input.email,
    replyTo: process.env.BOOKING_REPLY_TO_EMAIL || DEFAULT_CONTACT_TO_EMAIL,
    subject: `We received your Enchanted Havens inquiry · ${input.reference}`,
    html: `<div style="font-family:Arial,sans-serif;color:#18221f;max-width:640px;margin:auto;padding:36px"><p style="text-transform:uppercase;letter-spacing:.16em;color:#805a27;font-size:12px">Enchanted Havens</p><h1 style="font-family:Georgia,serif;color:#173c33;font-size:42px;font-weight:400">Your stay inquiry is with us.</h1><p>Dear ${input.name},</p><p>Thank you for sharing the shape of your trip. Our stay team will review your note and reply personally.</p><p><strong>Inquiry reference:</strong> ${input.reference}</p><p>You can reply directly to this email or call (360) 230-8143 if your dates are time-sensitive.</p><p style="color:#6f746f;font-size:13px">Your note: ${input.message || "No additional stay details were included."}</p></div>`,
  })
  return true
}
