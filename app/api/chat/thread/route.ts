import { cookies } from "next/headers"
import { after, NextResponse } from "next/server"
import {
  CHAT_UNAVAILABLE_ERROR,
  convertThreadToInquiry,
  createGuestChatThread,
  createGuestChatThreadSchema,
  getGuestChatThreadForGuest,
  syncHostawayTeamRepliesToThread,
} from "@/lib/chat"
import {
  GUEST_CHAT_THREAD_ID_COOKIE,
  GUEST_CHAT_THREAD_TOKEN_COOKIE,
  clearGuestChatCookies,
  setGuestChatCookies,
} from "@/lib/chat-cookies"

function errorResponse(error: unknown) {
  const typed = error as { name?: string; message?: string; flatten?: () => unknown }
  if (typed.name === "ZodError") return NextResponse.json({ error: "Invalid chat payload", details: typed.flatten?.() }, { status: 400 })
  return NextResponse.json(
    { error: typed.message || "Failed to process chat request" },
    { status: typed.message === CHAT_UNAVAILABLE_ERROR ? 503 : 500 },
  )
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const threadId = cookieStore.get(GUEST_CHAT_THREAD_ID_COOKIE)?.value
    const guestToken = cookieStore.get(GUEST_CHAT_THREAD_TOKEN_COOKIE)?.value
    if (!threadId || !guestToken) return NextResponse.json({ thread: null }, { status: 404 })

    let thread = await getGuestChatThreadForGuest(threadId, guestToken)
    if (!thread) {
      const response = NextResponse.json({ thread: null }, { status: 404 })
      clearGuestChatCookies(response)
      return response
    }
    if (thread.hostawayReservationId) {
      try {
        const imported = await syncHostawayTeamRepliesToThread(thread)
        if (imported > 0) thread = await getGuestChatThreadForGuest(threadId, guestToken) || thread
      } catch (error) {
        console.error("Failed to sync Hostaway replies into website chat:", error)
      }
    }
    return NextResponse.json({ thread })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = createGuestChatThreadSchema.parse(await request.json())
    const { thread, guestToken } = await createGuestChatThread(body)
    const response = NextResponse.json({ thread }, { status: 201 })
    setGuestChatCookies(response, thread.id, guestToken)
    if (thread.canConvertToInquiry) {
      after(async () => {
        try { await convertThreadToInquiry(thread.id) }
        catch (error) { console.error("Failed to link website chat to Hostaway:", error) }
      })
    }
    return response
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearGuestChatCookies(response)
  return response
}
