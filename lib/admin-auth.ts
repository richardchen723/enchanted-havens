import "server-only"

import { randomBytes, randomUUID } from "node:crypto"
import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { hashAdminToken, normalizeAdminEmail } from "@/lib/admin-auth-utils"
import { db, ensureSchema, isDatabaseConfigured } from "@/lib/db"

export { hashAdminToken, normalizeAdminEmail } from "@/lib/admin-auth-utils"

export const ADMIN_OWNER_EMAIL = "yunhang.chen@gmail.com"
export const ADMIN_OWNER_NAME = "Yunhang Chen"
export const ADMIN_SESSION_COOKIE = "enchanted_havens_admin"

const OWNER_ID = "7c1d2fb9-7744-4cc8-911b-43b15f0175f1"
const ACCESS_TOKEN_LIFETIME_MS = 20 * 60 * 1000
const SESSION_LIFETIME_MS = 14 * 24 * 60 * 60 * 1000

export type AdminRole = "owner" | "admin"
export type AdminStatus = "invited" | "active" | "removed"
export type AdminAccessTokenFailureReason = "expired" | "invalid" | "used"

export type AdminUser = {
  id: string
  email: string
  fullName: string
  role: AdminRole
  status: AdminStatus
  invitedAt: string | null
  acceptedAt: string | null
  lastSignedInAt: string | null
  createdAt: string
}

type AdminUserRow = {
  id: string
  email: string
  full_name: string
  role: AdminRole
  status: AdminStatus
  invited_at: Date | string | null
  accepted_at: Date | string | null
  last_signed_in_at: Date | string | null
  created_at: Date | string
}

let adminBackendReady: Promise<void> | null = null

function iso(value: Date | string | null) {
  return value ? new Date(value).toISOString() : null
}

function adminUserDto(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    invitedAt: iso(row.invited_at),
    acceptedAt: iso(row.accepted_at),
    lastSignedInAt: iso(row.last_signed_in_at),
    createdAt: iso(row.created_at) || new Date(0).toISOString(),
  }
}

function newAdminToken() {
  return randomBytes(32).toString("base64url")
}

export async function ensureAdminBackend() {
  if (!isDatabaseConfigured()) throw new Error("The admin database is not configured.")
  if (adminBackendReady) return adminBackendReady
  adminBackendReady = (async () => {
    await ensureSchema()
    await db()`
      insert into admin_users (id, email, full_name, role, status, accepted_at)
      values (${OWNER_ID}, ${ADMIN_OWNER_EMAIL}, ${ADMIN_OWNER_NAME}, 'owner', 'active', now())
      on conflict ((lower(email))) do update set
        full_name = excluded.full_name,
        role = 'owner',
        status = 'active',
        accepted_at = coalesce(admin_users.accepted_at, now()),
        updated_at = now()
    `
  })()
  return adminBackendReady
}

export async function getAdminUserByEmail(email: string) {
  await ensureAdminBackend()
  const rows = await db()<AdminUserRow[]>`
    select id, email, full_name, role, status, invited_at, accepted_at, last_signed_in_at, created_at
    from admin_users
    where lower(email) = ${normalizeAdminEmail(email)} and status in ('invited', 'active')
    limit 1
  `
  return rows[0] ? adminUserDto(rows[0]) : null
}

export async function createAdminAccessToken(userId: string, purpose: "sign_in" | "invite") {
  await ensureAdminBackend()
  const recent = await db()<Array<{ recently_sent: boolean }>>`
    select exists(
      select 1 from admin_access_tokens
      where user_id = ${userId} and created_at > now() - interval '60 seconds'
    ) as recently_sent
  `
  if (recent[0]?.recently_sent) return null

  const token = newAdminToken()
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_LIFETIME_MS)
  await db()`
    delete from admin_access_tokens
    where expires_at < now() - interval '7 days'
      or used_at < now() - interval '7 days'
  `
  await db()`
    insert into admin_access_tokens (id, user_id, purpose, token_hash, expires_at)
    values (${randomUUID()}, ${userId}, ${purpose}, ${hashAdminToken(token)}, ${expiresAt})
  `
  return { token, expiresAt }
}

export async function revokeAdminAccessToken(token: string) {
  if (!isDatabaseConfigured()) return
  await ensureAdminBackend()
  await db()`delete from admin_access_tokens where token_hash = ${hashAdminToken(token)}`
}

export async function consumeAdminAccessToken(token: string) {
  if (!token || !isDatabaseConfigured()) return { ok: false as const, reason: "invalid" as const }
  await ensureAdminBackend()
  const tokenHash = hashAdminToken(token)
  const sessionToken = newAdminToken()
  const sessionHash = hashAdminToken(sessionToken)
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS)

  const result = await db().begin(async (transaction) => {
    const consumed = await transaction<Array<{ user_id: string }>>`
      update admin_access_tokens
      set used_at = now()
      where token_hash = ${tokenHash} and used_at is null and expires_at > now()
      returning user_id
    `
    if (!consumed[0]) {
      const tokenState = await transaction<Array<{ expired: boolean; used: boolean }>>`
        select expires_at <= now() as expired, used_at is not null as used
        from admin_access_tokens
        where token_hash = ${tokenHash}
        limit 1
      `
      const reason: AdminAccessTokenFailureReason = tokenState[0]?.used
        ? "used"
        : tokenState[0]?.expired
          ? "expired"
          : "invalid"
      return { ok: false as const, reason }
    }

    const users = await transaction<AdminUserRow[]>`
      update admin_users
      set status = 'active', accepted_at = coalesce(accepted_at, now()), last_signed_in_at = now(), updated_at = now()
      where id = ${consumed[0].user_id} and status in ('invited', 'active')
      returning id, email, full_name, role, status, invited_at, accepted_at, last_signed_in_at, created_at
    `
    if (!users[0]) return { ok: false as const, reason: "invalid" as const }

    await transaction`
      insert into admin_sessions (token_hash, user_id, expires_at)
      values (${sessionHash}, ${users[0].id}, ${expiresAt})
    `
    return { ok: true as const, user: adminUserDto(users[0]), sessionToken, expiresAt }
  })

  return result
}

export function adminSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/admin",
    expires: expiresAt,
    priority: "high" as const,
  }
}

export const getCurrentAdminUser = cache(async () => {
  if (!isDatabaseConfigured()) return null
  const sessionToken = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!sessionToken) return null
  await ensureAdminBackend()
  const rows = await db()<AdminUserRow[]>`
    select u.id, u.email, u.full_name, u.role, u.status, u.invited_at, u.accepted_at, u.last_signed_in_at, u.created_at
    from admin_sessions s
    join admin_users u on u.id = s.user_id
    where s.token_hash = ${hashAdminToken(sessionToken)}
      and s.expires_at > now()
      and u.status = 'active'
    limit 1
  `
  return rows[0] ? adminUserDto(rows[0]) : null
})

export async function requireAdminUser() {
  const user = await getCurrentAdminUser()
  if (!user) redirect("/admin/login")
  return user
}

export async function requireAdminOwner() {
  const user = await getCurrentAdminUser()
  if (!user) redirect("/admin/login")
  if (user.role !== "owner") throw new Error("Only the owner can manage administrator access.")
  return user
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (sessionToken && isDatabaseConfigured()) {
    await ensureAdminBackend()
    await db()`delete from admin_sessions where token_hash = ${hashAdminToken(sessionToken)}`
  }
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

export async function listAdminUsers() {
  await ensureAdminBackend()
  const rows = await db()<AdminUserRow[]>`
    select id, email, full_name, role, status, invited_at, accepted_at, last_signed_in_at, created_at
    from admin_users
    where status in ('invited', 'active')
    order by case when role = 'owner' then 0 else 1 end, created_at
  `
  return rows.map(adminUserDto)
}

export async function inviteAdminUser(input: { email: string; fullName: string; invitedBy: string }) {
  await ensureAdminBackend()
  const email = normalizeAdminEmail(input.email)
  const existing = await db()<AdminUserRow[]>`
    select id, email, full_name, role, status, invited_at, accepted_at, last_signed_in_at, created_at
    from admin_users where lower(email) = ${email} limit 1
  `
  if (existing[0]?.role === "owner") throw new Error("The owner already has full access.")
  if (existing[0]?.status === "active") throw new Error("That person already has administrator access.")

  const rows = await db()<AdminUserRow[]>`
    insert into admin_users (id, email, full_name, role, status, invited_by, invited_at)
    values (${existing[0]?.id || randomUUID()}, ${email}, ${input.fullName.trim()}, 'admin', 'invited', ${input.invitedBy}, now())
    on conflict ((lower(email))) do update set
      full_name = excluded.full_name,
      role = 'admin',
      status = 'invited',
      invited_by = excluded.invited_by,
      invited_at = now(),
      updated_at = now()
    returning id, email, full_name, role, status, invited_at, accepted_at, last_signed_in_at, created_at
  `
  return adminUserDto(rows[0])
}

export async function removeAdminUser(userId: string) {
  await ensureAdminBackend()
  const removed = await db().begin(async (transaction) => {
    const rows = await transaction<Array<{ id: string }>>`
      update admin_users
      set status = 'removed', updated_at = now()
      where id = ${userId} and role = 'admin' and status in ('invited', 'active')
      returning id
    `
    if (!rows[0]) return false
    await transaction`delete from admin_sessions where user_id = ${userId}`
    await transaction`delete from admin_access_tokens where user_id = ${userId}`
    return true
  })
  return removed
}

export async function getAdminDashboardData() {
  await ensureAdminBackend()
  const [counts, activity, team] = await Promise.all([
    db()<Array<{ upcoming_stays: number; recent_inquiries: number; active_listings: number }>>`
      select
        (select count(*)::int from booking_sessions where status = 'confirmed' and check_in >= current_date and check_in < current_date + interval '30 days') as upcoming_stays,
        (select count(*)::int from contact_inquiries where created_at >= now() - interval '30 days') as recent_inquiries,
        (select count(distinct listing_id)::int from booking_sessions) as active_listings
    `,
    db()<Array<{ kind: "booking" | "inquiry"; title: string; detail: string; status: string; created_at: Date | string }>>`
      select kind, title, detail, status, created_at from (
        select
          'booking'::text as kind,
          coalesce(nullif(trim(concat_ws(' ', guest->>'firstName', guest->>'lastName')), ''), 'Guest booking') as title,
          concat(replace(variant_slug, '-', ' '), ' · ', check_in::text, '–', check_out::text) as detail,
          status,
          created_at
        from booking_sessions
        union all
        select
          'inquiry'::text as kind,
          name as title,
          coalesce(nullif(trip_type, ''), 'General stay inquiry') as detail,
          'New inquiry'::text as status,
          created_at
        from contact_inquiries
      ) recent
      order by created_at desc
      limit 5
    `,
    listAdminUsers(),
  ])
  return {
    metrics: {
      upcomingStays: counts[0]?.upcoming_stays || 0,
      recentInquiries: counts[0]?.recent_inquiries || 0,
      activeListings: counts[0]?.active_listings || 0,
    },
    activity: activity.map((item) => ({ ...item, createdAt: iso(item.created_at) || new Date(0).toISOString() })),
    team,
  }
}
