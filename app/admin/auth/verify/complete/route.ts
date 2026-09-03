import { NextResponse } from "next/server"
import { z } from "zod"
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  consumeAdminAccessToken,
  getCurrentAdminUser,
  type AdminAccessTokenFailureReason,
} from "@/lib/admin-auth"

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{20,200}$/)
const dashboardPath = "/admin/dashboard?welcome=1"

function acceptsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false
}

function successResponse(request: Request) {
  return acceptsJson(request)
    ? NextResponse.json({ ok: true, redirectTo: dashboardPath })
    : NextResponse.redirect(new URL(dashboardPath, request.url), 303)
}

function failureResponse(request: Request, reason: AdminAccessTokenFailureReason) {
  if (acceptsJson(request)) {
    return NextResponse.json({ ok: false, reason }, { status: reason === "invalid" ? 400 : 410 })
  }
  const error = reason === "used" ? "used-link" : reason === "expired" ? "expired-link" : "invalid-link"
  return NextResponse.redirect(new URL(`/admin/login?error=${error}`, request.url), 303)
}

export async function POST(request: Request) {
  if (await getCurrentAdminUser()) return successResponse(request)

  const formData = await request.formData()
  const parsed = tokenSchema.safeParse(formData.get("token"))
  if (!parsed.success) return failureResponse(request, "invalid")

  try {
    const session = await consumeAdminAccessToken(parsed.data)
    if (!session.ok) return failureResponse(request, session.reason)

    const response = successResponse(request)
    response.cookies.set(ADMIN_SESSION_COOKIE, session.sessionToken, adminSessionCookieOptions(session.expiresAt))
    return response
  } catch (error) {
    console.error("Unable to verify admin access link", error)
    return failureResponse(request, "invalid")
  }
}
