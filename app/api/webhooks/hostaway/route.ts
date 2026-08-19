import { createHash } from "node:crypto"
import { revalidatePath } from "next/cache"
import { after, NextResponse } from "next/server"
import { processHostawayChatMessageEvent } from "@/lib/chat"
import { db, ensureSchema, isDatabaseConfigured } from "@/lib/db"
import { isValidHostawayWebhookAuthorization, parseHostawayChatWebhook } from "@/lib/hostaway-webhook"

export const maxDuration = 60

export async function POST(request: Request) {
  const secret = process.env.HOSTAWAY_WEBHOOK_SECRET
  const login = process.env.HOSTAWAY_WEBHOOK_LOGIN || ""
  const password = process.env.HOSTAWAY_WEBHOOK_PASSWORD || ""
  if (!isDatabaseConfigured()) return new Response("Webhook is not configured", { status: 503 })
  const supplied = request.headers.get("x-hostaway-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const secretAuthorized = Boolean(secret && supplied === secret)
  const basicAuthorized = isValidHostawayWebhookAuthorization(request.headers.get("authorization"), login, password)
  const allowUnconfiguredDevelopment = process.env.NODE_ENV !== "production" && !secret && !login && !password
  if (!secretAuthorized && !basicAuthorized && !allowUnconfiguredDevelopment) return new Response("Unauthorized", { status: 401 })
  const payload = await request.json().catch(() => null)
  if (!payload) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const eventId = String(payload.id || payload.eventId || createHash("sha256").update(JSON.stringify(payload)).digest("hex"))
  const eventType = String(payload.type || payload.event || "hostaway.event")
  await ensureSchema()
  await db()`insert into webhook_events (id, source, event_type, payload, processed_at) values (${eventId}, 'hostaway', ${eventType}, ${db().json(payload as never)}, now()) on conflict (id) do nothing`
  revalidatePath("/havens")
  revalidatePath("/", "page")
  const chatEvent = parseHostawayChatWebhook(payload)
  if (chatEvent.supported && (chatEvent.reservationId || chatEvent.conversationId || chatEvent.messageId)) {
    after(async () => {
      try {
        await processHostawayChatMessageEvent(chatEvent)
        await new Promise((resolve) => setTimeout(resolve, 30_000))
        await processHostawayChatMessageEvent(chatEvent)
      } catch (error) {
        console.error("Failed to process Hostaway chat webhook:", error)
      }
    })
  }
  return Response.json({ received: true, chatAccepted: chatEvent.supported })
}
