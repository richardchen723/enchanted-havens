import { formatDistanceToNowStrict } from "date-fns"
import { ArrowRight, BedDouble, CheckCircle2, CircleCheck, Percent, Plus, ShieldCheck, TicketCheck, Users } from "lucide-react"
import Link from "next/link"
import { inviteAdminAction } from "@/app/admin/actions"
import { AdminShell, adminInitials } from "@/components/admin/admin-shell"
import { AdminSubmitButton } from "@/components/admin/admin-submit-button"
import { RemoveAdminControl } from "@/components/admin/remove-admin-control"
import { listAdminUsers, requireAdminUser, type AdminUser } from "@/lib/admin-auth"
import { getCatalog } from "@/lib/catalog"
import { getCouponOverview, type PropertyCoupon } from "@/lib/coupons"

export const dynamic = "force-dynamic"

const messages: Record<string, string> = {
  "invite-sent": "Invitation sent. Their one-time access link expires in 20 minutes.",
  "invite-recently-sent": "An access link was sent recently. Please wait a minute before sending another.",
  "access-removed": "Administrator access was removed and their open sessions were closed.",
}

const errors: Record<string, string> = {
  "invalid-invite": "Add a valid name and email address.",
  "already-admin": "That person already has administrator access.",
  "email-not-configured": "The user was saved, but email delivery is not configured yet.",
  "invite-failed": "The invitation could not be sent. Please try again.",
  "invalid-user": "That administrator could not be found.",
  "remove-failed": "Access could not be removed.",
}

function userStatus(user: AdminUser) {
  if (user.role === "owner") return "Full access"
  if (user.status === "invited") return "Invitation pending"
  return user.lastSignedInAt ? `Signed in ${formatDistanceToNowStrict(new Date(user.lastSignedInAt), { addSuffix: true })}` : "Active"
}

function offerLabel(coupon: PropertyCoupon) {
  return coupon.discountType === "percentage" ? `${coupon.discountValue}% off` : `$${coupon.discountValue.toFixed(2)} off`
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requireAdminUser()
  const [team, catalog, couponOverview, query] = await Promise.all([listAdminUsers(), getCatalog(), getCouponOverview(), searchParams])
  const showInvite = query.invite === "1" && viewer.role === "owner"
  const notice = typeof query.notice === "string" ? messages[query.notice] : null
  const error = typeof query.error === "string" ? errors[query.error] : null
  const welcome = query.welcome === "1"
  const metrics = [
    { label: "Properties", value: String(catalog.length), note: "Ready to manage", icon: BedDouble },
    { label: "Active coupons", value: String(couponOverview.active), note: "Available to guests", icon: Percent },
    { label: "Coupon uses", value: String(couponOverview.redemptions), note: "Confirmed reservations", icon: TicketCheck },
  ]

  return (
    <AdminShell viewer={viewer} active="overview">
      {welcome ? <div role="status" className="mb-6 flex items-center gap-3 rounded-xl border border-[#63806a]/22 bg-[#e7efe8] p-4 text-sm text-[#36533e]"><CheckCircle2 className="size-4" />You’re signed in securely. Welcome to your admin portal.</div> : null}
      {notice ? <div role="status" className="mb-6 flex items-center gap-3 rounded-xl border border-[#63806a]/22 bg-[#e7efe8] p-4 text-sm text-[#36533e]"><CheckCircle2 className="size-4" />{notice}</div> : null}
      {error ? <div role="alert" className="mb-6 rounded-xl border border-red-900/15 bg-red-50 p-4 text-sm text-red-900">{error}</div> : null}

      <section className="flex flex-col gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#97723c]">Workspace at a glance</p><h1 className="mt-3 font-display text-5xl leading-none text-[#173c33] sm:text-6xl">Welcome home, {viewer.fullName.split(" ")[0]}.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-black/52">Manage each haven, shape guest offers, and control who can access the private workspace.</p></div>
        <Link href="/admin/properties" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#173c33] px-5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_30px_rgba(23,60,51,.18)]">Manage properties <ArrowRight className="size-4" /></Link>
      </section>

      <section aria-label="Key metrics" className="grid gap-4 py-7 md:grid-cols-3">
        {metrics.map((metric) => { const Icon = metric.icon; return <article key={metric.label} className="rounded-xl border border-black/8 bg-[#fbf9f4] p-6 shadow-[0_14px_45px_rgba(23,60,51,.045)]"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-black/52">{metric.label}</p><span className="grid size-9 place-items-center rounded-lg bg-[#173c33]/8 text-[#173c33]"><Icon className="size-4" /></span></div><p className="mt-6 font-display text-5xl leading-none text-[#173c33]">{metric.value}</p><p className="mt-3 flex items-center gap-2 text-xs text-black/42"><CircleCheck className="size-3.5 text-[#5d7d65]" />{metric.note}</p></article> })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_.8fr]">
        <article className="overflow-hidden rounded-xl border border-black/8 bg-[#fbf9f4] shadow-[0_14px_45px_rgba(23,60,51,.045)]">
          <div className="flex items-center justify-between border-b border-black/8 px-6 py-5"><div><h2 className="font-display text-3xl text-[#173c33]">Recent coupons</h2><p className="mt-1 text-xs text-black/42">The latest guest offers across your properties</p></div><Link href="/admin/properties" className="text-xs font-bold uppercase tracking-[0.12em] text-[#805a27]">All properties</Link></div>
          {couponOverview.recent.length ? <div>{couponOverview.recent.map((coupon) => <Link key={coupon.id} href={`/admin/properties/${coupon.propertySlug}#coupons`} className="grid gap-3 border-b border-black/7 px-6 py-5 transition last:border-0 hover:bg-[#f3eee3]/55 sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e7e0d2] text-[#173c33]"><Percent className="size-4" /></span><div><p className="font-mono text-sm font-bold tracking-[0.08em] text-[#173c33]">{coupon.code}</p><p className="mt-1 text-xs text-black/48">{coupon.propertySlugs.length} {coupon.propertySlugs.length === 1 ? "property" : "properties"} · {offerLabel(coupon)}</p></div></div><span className={`w-fit rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] ${coupon.isActive ? "bg-[#e7efe8] text-[#43634b]" : "bg-black/6 text-black/42"}`}>{coupon.isActive ? "Active" : "Paused"}</span></Link>)}</div> : <div className="px-6 py-12 text-center"><Percent className="mx-auto size-6 text-[#805a27]" /><p className="mt-4 font-display text-2xl text-[#173c33]">Create your first guest offer.</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/45">Choose one or more properties, create a fixed or percentage discount, and set the exact rules guests must meet.</p><Link href="/admin/properties" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#173c33]/18 px-4 text-xs font-bold uppercase tracking-[0.1em] text-[#173c33]">Choose properties <ArrowRight className="size-3.5" /></Link></div>}
        </article>

        <article className="rounded-xl bg-[#173c33] p-6 text-[#f6f0e5] shadow-[0_18px_55px_rgba(23,60,51,.16)]">
          <div className="flex items-start justify-between"><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#d5b578]">Team access</p><h2 className="mt-3 font-display text-3xl">{team.length} team {team.length === 1 ? "member" : "members"}</h2></div><Users className="size-5 text-[#d5b578]" /></div>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#f3eee3] text-xs font-bold text-[#173c33]">{adminInitials(viewer.fullName)}</span><div className="min-w-0"><p className="text-sm font-semibold">{viewer.fullName}</p><p className="truncate text-xs text-white/48">{viewer.email}</p></div></div><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4"><span className="rounded-full border border-[#d5b578]/30 bg-[#d5b578]/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#e0c28f]">{viewer.role}</span><span className="text-[0.65rem] text-white/38">{viewer.role === "owner" ? "Full access" : "Admin access"}</span></div></div>
          <Link href="#team" className="mt-5 flex min-h-11 w-full items-center justify-between rounded-lg border border-white/12 px-4 text-sm text-white/72 transition hover:bg-white/5 hover:text-white"><span>Manage team</span><ArrowRight className="size-4" /></Link>
        </article>
      </section>

      <section id="team" className="mt-7 scroll-mt-40 rounded-xl border border-black/8 bg-[#fbf9f4] shadow-[0_14px_45px_rgba(23,60,51,.045)]">
        <div className="flex flex-col gap-4 border-b border-black/8 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#97723c]">Access control</p><h2 className="mt-2 font-display text-3xl text-[#173c33]">Team members</h2></div>{viewer.role === "owner" && !showInvite ? <Link href="?invite=1#team" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#173c33]/18 px-4 text-xs font-bold uppercase tracking-[0.1em] text-[#173c33]"><Plus className="size-3.5" />Add administrator</Link> : null}</div>

        {showInvite ? <div className="border-b border-black/8 bg-[#f3eee3]/65 p-6"><div className="max-w-3xl"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#173c33] text-[#d5b578]"><ShieldCheck className="size-4" /></span><div><h3 className="font-display text-2xl text-[#173c33]">Invite an administrator</h3><p className="mt-1 text-sm leading-6 text-black/48">They’ll receive a one-time email link and can manage properties and coupons after accepting.</p></div></div><form action={inviteAdminAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.25fr_auto] sm:items-end"><label><span className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-black/52">Full name</span><input name="fullName" required minLength={2} maxLength={160} autoComplete="name" className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" placeholder="Alex Morgan" /></label><label><span className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-black/52">Email address</span><input name="email" required type="email" maxLength={320} autoComplete="email" className="min-h-12 w-full rounded-lg border border-black/12 bg-white px-4" placeholder="alex@example.com" /></label><div className="flex gap-2"><AdminSubmitButton className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#173c33] px-5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60">Send invite</AdminSubmitButton><Link href="#team" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-black/10 bg-white px-4 text-xs font-semibold">Cancel</Link></div></form></div></div> : null}

        <div className="divide-y divide-black/7">
          {team.map((user) => <div key={user.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e7e0d2] text-xs font-bold text-[#173c33]">{adminInitials(user.fullName)}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold">{user.fullName}</p><span className={`rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] ${user.role === "owner" ? "bg-[#173c33] text-white" : user.status === "invited" ? "bg-[#eee2cf] text-[#805a27]" : "bg-[#e7efe8] text-[#43634b]"}`}>{user.role === "owner" ? "Owner" : user.status}</span></div><p className="mt-1 truncate text-xs text-black/42">{user.email}</p></div></div><p className="text-xs text-black/42 sm:w-44">{userStatus(user)}</p>{viewer.role === "owner" && user.role === "admin" ? <RemoveAdminControl userId={user.id} fullName={user.fullName} /> : <span className="inline-flex min-h-10 items-center gap-2 px-3 text-xs text-black/32"><ShieldCheck className="size-3.5" />Protected</span>}</div>)}
        </div>
      </section>
    </AdminShell>
  )
}
