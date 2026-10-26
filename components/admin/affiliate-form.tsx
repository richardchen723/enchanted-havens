import { saveAffiliateAction } from "@/app/admin/affiliates/actions"
import { AdminSubmitButton } from "@/components/admin/admin-submit-button"
import type { Affiliate } from "@/lib/affiliate-rules"

const field = "mt-2 block min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm font-normal"
const label = "block text-xs font-semibold text-[#173c33]"

export function AffiliateForm({ affiliate }: { affiliate?: Affiliate }) {
  return (
    <form id="affiliate-form" action={saveAffiliateAction} className="grid gap-5 rounded-xl border border-black/10 bg-[#fbf9f4] p-5 sm:grid-cols-2 sm:p-7">
      {affiliate ? <input type="hidden" name="id" value={affiliate.id} /> : null}
      <div className="sm:col-span-2"><h2 className="font-display text-3xl">{affiliate ? "Partner details & terms" : "Add an affiliate"}</h2><p className="mt-2 text-sm leading-6 text-black/55">All fixed amounts are USD. Rates apply to accommodation before discounts, excluding taxes and fees. Changes apply to new checkouts.</p></div>
      <label className={label}>Partner name<input className={field} name="name" required minLength={2} maxLength={160} defaultValue={affiliate?.name} /></label>
      <label className={label}>Email<input className={field} name="email" type="email" required maxLength={320} defaultValue={affiliate?.email} /></label>
      <label className={label}>Social handle<input className={field} name="socialHandle" maxLength={160} defaultValue={affiliate?.socialHandle} placeholder="@partner" /></label>
      <label className={label}>Referral code<input className={field} name="code" required minLength={3} maxLength={50} pattern="[A-Za-z0-9_-]+" readOnly={Boolean(affiliate)} defaultValue={affiliate?.code} placeholder="partner-name" /><span className="mt-2 block font-normal text-black/50">Permanent once created; letters, numbers, hyphens and underscores.</span></label>
      <label className={label}>Guest discount type<select className={field} name="discountType" defaultValue={affiliate?.discountType || "percentage"}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount (USD)</option></select></label>
      <label className={label}>Guest discount value<input className={field} name="discountValue" type="number" min="0" max="10000" step="0.01" required defaultValue={affiliate?.discountValue ?? 0} /></label>
      <label className={label}>Commission type<select className={field} name="commissionType" defaultValue={affiliate?.commissionType || "percentage"}><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount (USD)</option></select></label>
      <label className={label}>Commission value<input className={field} name="commissionValue" type="number" min="0" max="10000" step="0.01" required defaultValue={affiliate?.commissionValue ?? 0} /></label>
      <label className={label}>Offer starts (UTC, optional)<input className={field} name="startsOn" type="date" defaultValue={affiliate?.startsOn || ""} /></label>
      <label className={label}>Offer ends (UTC, optional)<input className={field} name="endsOn" type="date" defaultValue={affiliate?.endsOn || ""} /></label>
      <label className={label}>Status<select className={field} name="status" defaultValue={affiliate?.status || "inactive"}><option value="inactive">Inactive</option><option value="active">Active</option></select></label>
      <label className={`${label} sm:col-span-2`}>Internal notes<textarea className={`${field} py-3`} name="notes" rows={3} maxLength={2000} defaultValue={affiliate?.notes} /></label>
      <AdminSubmitButton className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#173c33] px-5 text-sm font-semibold text-white sm:col-span-2">{affiliate ? "Save partner" : "Create affiliate"}</AdminSubmitButton>
    </form>
  )
}
