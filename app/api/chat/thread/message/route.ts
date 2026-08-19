import { cookies } from "next/headers"
import { after, NextResponse } from "next/server"
import {
  CHAT_UNAVAILABLE_ERROR,
  appendGuestChatMessageSchema,
  appendGuestMessageToThread,
  convertThreadToInquiry,
} from "@/lib/chat"
import { GUEST_CHAT_THREAD_ID_COOKIE, GUEST_CHAT_THREAD_TOKEN_COOKIE } from "@/lib/chat-cookies"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const threadId = cookieStore.get(GUEST_CHAT_THREAD_ID_COOKIE)?.value
    const guestToken = cookieStore.get(GUEST_CHAT_THREAD_TOKEN_COOKIE)?.value
    if (!threadId || !guestToken) return NextResponse.json({ error: "No active chat thread found" }, { status: 404 })

    const body = appendGuestChatMessageSchema.parse(await request.json())
    const thread = await appendGuestMessageToThread(threadId, guestToken, body)
    if (!thread.hostawayReservationId && thread.canConvertToInquiry) {
      after(async () => {
        try { await convertThreadToInquiry(thread.id) }
        catch (error) { console.error("Failed to link website chat after guest reply:", error) }
      })
    }
    return NextResponse.json({ thread })
  } catch (error) {
    const typed = error as { name?: string; message?: string; flatten?: () => unknown }
    if (typed.name === "ZodError") return NextResponse.json({ error: "Invalid chat payload", details: typed.flatten?.() }, { status: 400 })
    const status = typed.message === CHAT_UNAVAILABLE_ERROR ? 503
      : typed.message === "Chat thread not found" ? 404
        : typed.message === "This conversation is closed" ? 409 : 500
    return NextResponse.json({ error: typed.message || "Failed to send chat message" }, { status })
  }
}
