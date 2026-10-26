import { updateCommissionAction } from "@/app/admin/affiliates/actions"
import { AdminSubmitButton } from "@/components/admin/admin-submit-button"
import type { AffiliateCommission } from "@/lib/affiliates"
import { formatCurrency } from "@/lib/utils"

export function AffiliateCommissions({ commissions }: { commissions: AffiliateCommission[] }) {
  return (
    <section id="commissions" className="mt-10">
      <h2 className="font-display text-3xl">Booking commissions</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-black/55">Review cancellations, refunds and stay changes before paying. Update the amount or mark cancelled with a note when needed. Mark paid only after paying outside this website; this records the payment and does not transfer funds.</p>
      {!commissions.length ? <p className="mt-5 rounded-xl border border-dashed border-black/20 p-8 text-sm text-black/50">No attributed bookings yet. Confirmed referral bookings will appear here.</p> : <div className="mt-5 grid gap-4">{commissions.map((commission) => (
        <article key={commission.id} className="rounded-xl border border-black/10 bg-[#fbf9f4] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{commission.affiliate_name}</h3><p className="mt-1 text-sm capitalize text-black/55">{commission.property_slug.replaceAll("-", " ")} · {commission.check_in} – {commission.check_out}</p><p className="mt-2 break-all text-xs text-black/50">Hostaway #{commission.hostaway_reservation_id} · Booking {commission.booking_session_id}</p></div><span className="rounded-full bg-[#173c33]/8 px-3 py-1 text-xs font-semibold capitalize">{commission.status}</span></div>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-black/8 py-4 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-black/50">Accommodation</dt><dd className="mt-1">{formatCurrency(commission.snapshot.revenueBasis, "USD", { cents: true })}</dd></div>
            <div><dt className="text-xs text-black/50">Guest savings</dt><dd className="mt-1">{formatCurrency(commission.snapshot.discountAmount, "USD", { cents: true })}</dd></div>
            <div><dt className="text-xs text-black/50">Booked commission</dt><dd className="mt-1">{formatCurrency(commission.snapshot.commissionAmount, "USD", { cents: true })}</dd></div>
            <div><dt className="text-xs text-black/50">Current commission</dt><dd className="mt-1 font-semibold">{formatCurrency(Number(commission.amount), "USD", { cents: true })}</dd></div>
          </dl>
          <details className="mt-4"><summary className="cursor-pointer py-2 text-sm font-semibold">Update commission record</summary>
            <form action={updateCommissionAction} className="mt-4 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={commission.id} />
              <label className="text-xs font-semibold">Status<select name="status" defaultValue={commission.status} className="mt-2 block min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm"><option value="owed">Owed</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select></label>
              <label className="text-xs font-semibold">Amount (USD)<input name="amount" type="number" min="0" max="1000000" step="0.01" required defaultValue={Number(commission.amount)} className="mt-2 block min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm" /></label>
              <label className="text-xs font-semibold sm:col-span-2">Payment reference or reason for change<textarea name="notes" minLength={3} maxLength={2000} required defaultValue={commission.payout_notes} className="mt-2 block w-full rounded-lg border border-black/15 bg-white p-3 text-sm" rows={2} /></label>
              <AdminSubmitButton className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#173c33] px-4 text-sm font-semibold text-white sm:col-span-2">Save commission record</AdminSubmitButton>
            </form>
          </details>
        </article>
      ))}</div>}
    </section>
  )
}
