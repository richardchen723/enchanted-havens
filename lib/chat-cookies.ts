import type { NextResponse } from "next/server"

export const GUEST_CHAT_THREAD_ID_COOKIE = "guest_chat_thread_id"
export const GUEST_CHAT_THREAD_TOKEN_COOKIE = "guest_chat_thread_token"

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  }
}

export function setGuestChatCookies(response: NextResponse, threadId: string, guestToken: string) {
  const options = getCookieOptions()
  response.cookies.set(GUEST_CHAT_THREAD_ID_COOKIE, threadId, options)
  response.cookies.set(GUEST_CHAT_THREAD_TOKEN_COOKIE, guestToken, options)
}

export function clearGuestChatCookies(response: NextResponse) {
  response.cookies.delete(GUEST_CHAT_THREAD_ID_COOKIE)
  response.cookies.delete(GUEST_CHAT_THREAD_TOKEN_COOKIE)
}
