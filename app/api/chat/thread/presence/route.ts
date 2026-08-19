import { cookies } from "next/headers"
import { after, NextResponse } from "next/server"
import {
  CHAT_UNAVAILABLE_ERROR,
  guestChatPresenceSchema,
  routeUnreadHostawayRepliesToSms,
  updateGuestChatPresence,
} from "@/lib/chat"
import { GUEST_CHAT_THREAD_ID_COOKIE, GUEST_CHAT_THREAD_TOKEN_COOKIE } from "@/lib/chat-cookies"

export async function POST(request: Request) {
  try {
    const { state } = guestChatPresenceSchema.parse(await request.json())
    const cookieStore = await cookies()
    const threadId = cookieStore.get(GUEST_CHAT_THREAD_ID_COOKIE)?.value
    const guestToken = cookieStore.get(GUEST_CHAT_THREAD_TOKEN_COOKIE)?.value
    if (!threadId || !guestToken) return NextResponse.json({ success: false }, { status: 404 })

    const updated = await updateGuestChatPresence(threadId, guestToken, state)
    if (!updated) return NextResponse.json({ success: false }, { status: 404 })
    if (state === "closed") after(async () => {
      const result = await routeUnreadHostawayRepliesToSms(threadId)
      if (result.status === "failed") console.error("Failed to route unread chat reply by SMS:", result.error)
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const typed = error as { name?: string; message?: string }
    if (typed.name === "ZodError") return NextResponse.json({ error: "Invalid presence state" }, { status: 400 })
    return NextResponse.json(
      { error: typed.message || "Failed to update chat presence" },
      { status: typed.message === CHAT_UNAVAILABLE_ERROR ? 503 : 500 },
    )
  }
}
