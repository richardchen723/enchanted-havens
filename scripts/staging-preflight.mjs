import { resolve4 } from "node:dns/promises"
import nodemailer from "nodemailer"
import postgres from "postgres"
import Stripe from "stripe"

const SEA_RENITY_LISTING_ID = "157299"

function requireValue(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

async function verifyDatabase() {
  const sql = postgres(requireValue("POSTGRES_URL"), {
    max: 1,
    connect_timeout: 5,
    prepare: false,
  })
  try {
    await sql`select 1 as ready`
  } finally {
    await sql.end()
  }
}

async function verifyStripe() {
  const secretKey = requireValue("STRIPE_SECRET_KEY")
  const publishableKey = requireValue("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
  if (!secretKey.startsWith("sk_test_") || !publishableKey.startsWith("pk_test_")) {
    throw new Error("Staging requires Stripe test keys.")
  }
  const balance = await new Stripe(secretKey).balance.retrieve()
  if (balance.livemode) throw new Error("Stripe unexpectedly reported live mode.")
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
  if (process.env.BOOKING_WRITE_MODE !== "staging") throw new Error("BOOKING_WRITE_MODE must be staging.")
  if (process.env.BOOKING_STAGING_LISTING_ID !== SEA_RENITY_LISTING_ID) {
    throw new Error(`BOOKING_STAGING_LISTING_ID must be ${SEA_RENITY_LISTING_ID} for Sea-Renity.`)
  }
  if (process.env.ALLOW_SANDBOX_CHECKOUT === "true") {
    throw new Error("ALLOW_SANDBOX_CHECKOUT must be false during the real Hostaway staging test.")
  }
  await verifyDatabase()
  console.log("OK  Postgres staging database")
  await verifyStripe()
  console.log("OK  Stripe test mode")
  await verifyHostaway()
  console.log("OK  Sea-Renity Hostaway access")
  await verifyGmail()
  console.log("OK  Gmail SMTP authentication")
  console.log("READY  One real Sea-Renity Hostaway test reservation may be created; Stripe will save a test payment method and no transaction will be created.")
}

main().catch((error) => {
  console.error(`NOT READY  ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
