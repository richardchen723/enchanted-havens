import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { CHAT_UNAVAILABLE_ERROR, markGuestThreadRead } from "@/lib/chat"
import { GUEST_CHAT_THREAD_ID_COOKIE, GUEST_CHAT_THREAD_TOKEN_COOKIE } from "@/lib/chat-cookies"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const threadId = cookieStore.get(GUEST_CHAT_THREAD_ID_COOKIE)?.value
    const guestToken = cookieStore.get(GUEST_CHAT_THREAD_TOKEN_COOKIE)?.value
    if (!threadId || !guestToken) return NextResponse.json({ thread: null }, { status: 404 })
    const thread = await markGuestThreadRead(threadId, guestToken)
    return NextResponse.json({ thread }, { status: thread ? 200 : 404 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update read state"
    return NextResponse.json({ error: message }, { status: message === CHAT_UNAVAILABLE_ERROR ? 503 : 500 })
  }
}
