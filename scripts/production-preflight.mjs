import { resolve4 } from "node:dns/promises"
import nodemailer from "nodemailer"
import postgres from "postgres"
import Stripe from "stripe"

const SEA_RENITY_LISTING_ID = "157299"
const PRODUCTION_SITE_URLS = new Set([
  "https://enchantedhavens.com",
  "https://www.enchantedhavens.com",
])

function requireValue(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

async function verifyDatabase() {
  const sql = postgres(requireValue("POSTGRES_URL"), {
    max: 1,
    connect_timeout: 8,
    prepare: false,
  })
  try {
    await sql`select 1 as ready`
  } finally {
    await sql.end()
  }
}

async function verifyStripe() {
  const serverKey = requireValue("STRIPE_SECRET_KEY")
  const publishableKey = requireValue("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
  if (!serverKey.startsWith("sk_live_") && !serverKey.startsWith("rk_live_")) {
    throw new Error("Production requires a Stripe live secret or restricted key.")
  }
  if (!publishableKey.startsWith("pk_live_")) {
    throw new Error("Production requires a Stripe live publishable key.")
  }

  const stripe = new Stripe(serverKey)
  await Promise.all([
    stripe.customers.list({ limit: 1 }),
    stripe.setupIntents.list({ limit: 1 }),
  ])
}

async function hostawayToken() {
  if (process.env.HOSTAWAY_ACCESS_TOKEN) return process.env.HOSTAWAY_ACCESS_TOKEN
  const response = await fetch("https://api.hostaway.com/v1/accessTokens", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: requireValue("HOSTAWAY_CLIENT_ID"),
      client_secret: requireValue("HOSTAWAY_CLIENT_SECRET"),
      scope: "general",
    }),
  })
  if (!response.ok) throw new Error(`Hostaway authentication failed (${response.status}).`)
  const payload = await response.json()
  if (!payload.access_token) throw new Error("Hostaway did not return an access token.")
  return payload.access_token
}

async function verifyHostaway() {
  const token = await hostawayToken()
  const response = await fetch(`https://api.hostaway.com/v1/listings/${SEA_RENITY_LISTING_ID}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Sea-Renity could not be read from Hostaway (${response.status}).`)
}

async function verifyGmail() {
  const smtpServer = "smtp.gmail.com"
  const host = process.env.GMAIL_SMTP_HOST || (await resolve4(smtpServer))[0] || smtpServer
  const transporter = nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: requireValue("GMAIL_USER"),
      pass: requireValue("GMAIL_APP_PASSWORD"),
    },
    tls: { servername: smtpServer },
  })
  await transporter.verify()
}

async function main() {
  if (process.env.BOOKING_WRITE_MODE !== "live") {
    throw new Error("BOOKING_WRITE_MODE must be live.")
  }
  if (!PRODUCTION_SITE_URLS.has(requireValue("NEXT_PUBLIC_SITE_URL"))) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use the Enchanted Havens production domain.")
  }
  if (!requireValue("STRIPE_WEBHOOK_SECRET").startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not a Stripe webhook signing secret.")
  }
  await verifyDatabase()
  console.log("OK  Production Postgres connection")
  await verifyStripe()
  console.log("OK  Stripe live Customer and SetupIntent access")
  await verifyHostaway()
  console.log("OK  Sea-Renity Hostaway access")
  await verifyGmail()
  console.log("OK  Gmail SMTP authentication")
  console.log("READY  Live checkout can save payment methods and create unpaid Hostaway reservations. No automatic charge is configured.")
}

main().catch((error) => {
  console.error(`NOT READY  ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
