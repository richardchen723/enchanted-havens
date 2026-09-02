import { NextResponse } from "next/server"
import { z } from "zod"
import { consumeAdminAccessToken, setAdminSessionCookie } from "@/lib/admin-auth"

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{20,200}$/)

export async function POST(request: Request) {
  const formData = await request.formData()
  const parsed = tokenSchema.safeParse(formData.get("token"))
  if (!parsed.success) return NextResponse.redirect(new URL("/admin/login?error=invalid-link", request.url), 303)

  try {
    const session = await consumeAdminAccessToken(parsed.data)
    if (!session) return NextResponse.redirect(new URL("/admin/login?error=invalid-link", request.url), 303)
    await setAdminSessionCookie(session.sessionToken, session.expiresAt)
    return NextResponse.redirect(new URL("/admin/dashboard?welcome=1", request.url), 303)
  } catch (error) {
    console.error("Unable to verify admin access link", error)
    return NextResponse.redirect(new URL("/admin/login?error=invalid-link", request.url), 303)
  }
}
