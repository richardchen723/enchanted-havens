import { requireAdminUser } from "@/lib/admin-auth"
import { listAffiliateCommissions } from "@/lib/affiliates"

function csvCell(value: unknown) {
  let text = String(value ?? "")
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

export async function GET() {
  await requireAdminUser()
  const commissions = await listAffiliateCommissions()
  const rows: unknown[][] = [["Affiliate", "Referral code", "Booking reference", "Hostaway reservation", "Property", "Check in", "Check out", "Currency", "Accommodation", "Guest discount", "Booked commission", "Current commission", "Status", "Notes"]]
  for (const item of commissions) rows.push([
    item.affiliate_name, item.snapshot.code, item.booking_session_id, item.hostaway_reservation_id,
    item.property_slug, item.check_in, item.check_out, "USD", item.snapshot.revenueBasis,
    item.snapshot.discountAmount, item.snapshot.commissionAmount, Number(item.amount), item.status, item.payout_notes,
  ])
  return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="affiliate-commissions.csv"', "Cache-Control": "private, no-store" },
  })
}
