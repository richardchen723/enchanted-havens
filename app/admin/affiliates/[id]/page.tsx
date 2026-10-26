import { notFound } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { AdminShell } from "@/components/admin/admin-shell"
import { AffiliateForm } from "@/components/admin/affiliate-form"
import { AffiliateCommissions } from "@/components/admin/affiliate-commissions"
import { requireAdminUser } from "@/lib/admin-auth"
import { listAffiliates, listAffiliateCommissions, listAffiliateAudit } from "@/lib/affiliates"
import { absoluteUrl } from "@/lib/utils"

export default async function AffiliatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await requireAdminUser()
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) notFound()
  const affiliate = (await listAffiliates()).find((item) => item.id === id)
  if (!affiliate) notFound()
  const [commissions, audit, query] = await Promise.all([listAffiliateCommissions(id), listAffiliateAudit(id), searchParams])
  return (
    <AdminShell viewer={viewer} active="affiliates">
      <Link href="/admin/affiliates" className="text-sm text-black/55">← All affiliates</Link>
      <h1 className="mt-5 font-display text-5xl">{affiliate.name}</h1>
      {query.error ? <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-900">Unable to save. Check the fields, dates and rates; percentages cannot exceed 100%. Referral codes cannot be changed.</p> : null}
      {query.saved ? <p role="status" className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-900">Partner saved.</p> : null}
      <section className="my-7 rounded-xl border border-[#97723c]/25 bg-[#eee5d6] p-5"><label className="text-sm font-semibold">Referral link<input aria-label="Referral link" readOnly value={absoluteUrl(`/r/${affiliate.code}`)} className="mt-3 block min-h-12 w-full rounded-lg border border-black/15 bg-white px-3 font-mono text-sm" /></label><p className="mt-3 text-sm leading-6 text-black/60">Share this link when the partner is active. The latest eligible referral lasts 30 days. For a specific haven, append <code>?haven=property-slug</code>. Entered coupons take precedence over referral offers and attribution.</p></section>
      <AffiliateForm affiliate={affiliate} />
      <AffiliateCommissions commissions={commissions} />
      <section className="mt-10"><h2 className="font-display text-3xl">Recent changes</h2><div className="mt-4 grid gap-3">{audit.map((entry, index) => <details key={index} className="rounded-lg border border-black/10 bg-[#fbf9f4] p-4"><summary className="cursor-pointer text-sm">{entry.action.replaceAll("-", " ")} · {entry.actor} · {new Date(entry.created_at).toISOString().slice(0, 16).replace("T", " ")} UTC</summary><pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all text-xs text-black/60">{JSON.stringify(entry.changes, null, 2)}</pre></details>)}</div></section>
    </AdminShell>
  )
}
