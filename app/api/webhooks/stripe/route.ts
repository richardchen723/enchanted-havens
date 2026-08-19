import { db, ensureSchema, isDatabaseConfigured } from "@/lib/db"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !isDatabaseConfigured()) return new Response("Webhook is not configured", { status: 503 })
  const signature = request.headers.get("stripe-signature")
  if (!signature) return new Response("Missing signature", { status: 400 })
  try {
    const payload = await request.text()
    const event = stripe().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)
    await ensureSchema()
    await db()`insert into webhook_events (id, source, event_type, payload, processed_at) values (${event.id}, 'stripe', ${event.type}, ${db().json(event as never)}, now()) on conflict (id) do nothing`
    return Response.json({ received: true })
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Invalid webhook", { status: 400 })
  }
}
