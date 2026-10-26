import type { Metadata } from "next"
import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import { AffiliateForm } from "@/components/admin/affiliate-form"
import { AffiliateCommissions } from "@/components/admin/affiliate-commissions"
import { requireAdminUser } from "@/lib/admin-auth"
import { listAffiliates, listAffiliateCommissions } from "@/lib/affiliates"
import { affiliateIsEligible } from "@/lib/affiliate-rules"
import { formatCurrency } from "@/lib/utils"

export const metadata: Metadata = { title: "Affiliates · Admin" }
export const dynamic = "force-dynamic"
const affiliateErrors: Record<string, string> = {
  invalid: "Check the required fields, dates and rates. Percentages must be between 0 and 100.",
  duplicate: "That referral code already belongs to an affiliate. Choose a different code.",
  "save-failed": "The changes could not be saved. Please try again.",
  "invalid-commission": "Enter a valid USD amount and a payment reference or reason for the change.",
}

export default async function AffiliatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await requireAdminUser()
  const [affiliates, commissions, query] = await Promise.all([listAffiliates(), listAffiliateCommissions(), searchParams])
  const owed = commissions.filter((item) => item.status === "owed").reduce((sum, item) => sum + Number(item.amount), 0)
  const paid = commissions.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount), 0)
  const visible = affiliates.filter((item) => (!query.q || `${item.name} ${item.code}`.toLowerCase().includes(query.q.toLowerCase())) && (!query.status || item.status === query.status))
  return (
    <AdminShell viewer={viewer} active="affiliates">
      {query.error ? <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-900">{affiliateErrors[query.error] || affiliateErrors["save-failed"]}</p> : null}
      {query.saved ? <p role="status" className="mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-900">Changes saved.</p> : null}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-7"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#97723c]">Partner program</p><h1 className="mt-3 font-display text-5xl">Affiliates</h1><p className="mt-3 text-sm text-black/55">Manage referral partners, booking attribution and commissions.</p></div><a download href="/admin/affiliates/export" className="rounded-lg border border-black/15 bg-white px-4 py-3 text-sm font-semibold">Export commissions (CSV)</a></div>
      <dl className="my-7 grid grid-cols-2 gap-4 lg:grid-cols-4">{[
        ["Eligible partners", affiliates.filter((item) => affiliateIsEligible(item)).length],
        ["Referral visits", affiliates.reduce((sum, item) => sum + item.visits, 0)],
        ["Commission owed", formatCurrency(owed, "USD", { cents: true })],
        ["Commission paid", formatCurrency(paid, "USD", { cents: true })],
      ].map(([name, value]) => <div key={name} className="rounded-xl border border-black/10 bg-[#fbf9f4] p-5"><dt className="text-xs text-black/50">{name}</dt><dd className="mt-3 text-2xl font-semibold">{value}</dd></div>)}</dl>
      <section aria-label="Affiliates"><form className="mb-4 flex flex-wrap gap-3"><input name="q" aria-label="Search partners" defaultValue={query.q} placeholder="Search name or code" className="min-h-11 min-w-0 flex-1 rounded-lg border border-black/15 bg-white px-3 text-sm" /><select name="status" aria-label="Partner status" defaultValue={query.status || ""} className="rounded-lg border border-black/15 bg-white px-3 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><button className="rounded-lg bg-[#173c33] px-5 py-3 text-sm font-semibold text-white">Filter</button></form>
        <div className="grid gap-3">{visible.map((affiliate) => <Link key={affiliate.id} href={`/admin/affiliates/${affiliate.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#fbf9f4] p-5 hover:border-[#173c33]/40"><div><h2 className="font-semibold">{affiliate.name}</h2><p className="mt-2 text-xs text-black/50">{affiliate.code} · {affiliate.visits} visits · {commissions.filter((item) => item.affiliate_id === affiliate.id).length} bookings</p></div><span className="text-xs font-semibold capitalize">{affiliate.status}{affiliate.status === "active" && !affiliateIsEligible(affiliate) ? " · Outside offer dates" : ""} →</span></Link>)}</div>
        {!visible.length ? <p className="py-8 text-sm text-black/50">{affiliates.length ? "No partners match these filters." : "Add your first affiliate below to create a referral link."}</p> : null}
      </section>
      <div className="mt-8"><AffiliateForm /></div>
      <AffiliateCommissions commissions={commissions} />
    </AdminShell>
  )
}
