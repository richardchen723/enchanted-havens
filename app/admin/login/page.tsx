import Link from "next/link"
import { ArrowLeft, CheckCircle2, KeyRound, Leaf, LockKeyhole } from "lucide-react"
import { redirect } from "next/navigation"
import { requestAdminSignInAction } from "@/app/admin/actions"
import { AdminSubmitButton } from "@/components/admin/admin-submit-button"
import { ensureAdminBackend, getCurrentAdminUser } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const errors: Record<string, string> = {
  "invalid-email": "Enter a valid email address.",
  "database-not-configured": "Admin access is waiting for the production database to be connected.",
  "email-not-configured": "Email delivery is not configured yet. Please contact the site owner.",
  "send-failed": "We could not send the sign-in link. Please try again in a moment.",
  "invalid-link": "That sign-in link is invalid or has expired. Request a fresh link below.",
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await ensureAdminBackend()
  const currentUser = await getCurrentAdminUser()
  if (currentUser) redirect("/admin/dashboard")
  const query = await searchParams
  const error = typeof query.error === "string" ? errors[query.error] : null
  const sent = query.sent === "1"
  const signedOut = query.signedOut === "1"

  return (
    <div className="grid min-h-dvh bg-[#f3efe6] text-[#16251f] lg:grid-cols-[1fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-[#0b2922] p-12 text-[#f8f4ea] lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute inset-0 opacity-35" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle at 18% 20%, rgba(213,181,120,.35), transparent 24%), radial-gradient(circle at 75% 72%, rgba(90,130,108,.4), transparent 32%)" }} />
        <div className="relative flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full border border-[#d5b578]/45 bg-white/5 text-[#e0c28f]"><Leaf className="size-4" /></span><div><p className="font-display text-2xl leading-none">Enchanted Havens</p><p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.23em] text-white/45">Private admin</p></div></div>
        <div className="relative max-w-xl"><p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#d5b578]">A quieter way to operate</p><h1 className="mt-6 font-display text-6xl leading-[0.93] xl:text-7xl">Everything that keeps the havens welcoming.</h1><p className="mt-7 max-w-md text-base leading-8 text-white/58">A private home for your stays, guest conversations, properties, and trusted team.</p></div>
        <div className="relative flex items-center gap-3 text-xs text-white/45"><LockKeyhole className="size-4 text-[#d5b578]" /> Restricted to invited administrators</div>
      </section>

      <main className="flex min-h-dvh items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#805a27]"><ArrowLeft className="size-4" /> Return to website</Link>
          <div className="mt-10 rounded-2xl border border-black/8 bg-[#fbf9f4] p-7 shadow-[0_24px_70px_rgba(23,60,51,.08)] sm:p-9">
            <span className="grid size-12 place-items-center rounded-xl bg-[#173c33] text-[#e0c28f]"><KeyRound className="size-5" /></span>
            <p className="mt-8 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#97723c]">Admin access</p>
            <h2 className="mt-3 font-display text-5xl leading-none text-[#173c33]">Sign in securely.</h2>
            <p className="mt-5 text-sm leading-7 text-black/52">Enter your invited email address and we’ll send a private, one-time sign-in link. No password to remember.</p>

            {sent ? <div role="status" className="mt-7 flex gap-3 rounded-xl border border-[#63806a]/22 bg-[#e7efe8] p-4 text-sm leading-6 text-[#36533e]"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><p>If the email has admin access, a link is on its way. It expires in 20 minutes.</p></div> : null}
            {signedOut ? <div role="status" className="mt-7 rounded-xl border border-black/8 bg-white p-4 text-sm text-black/58">You have been signed out.</div> : null}
            {error ? <p role="alert" className="mt-7 rounded-xl border border-red-900/15 bg-red-50 p-4 text-sm leading-6 text-red-900">{error}</p> : null}

            <form action={requestAdminSignInAction} className="mt-7 grid gap-4">
              <label><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-black/55">Email address</span><input className="min-h-13 w-full rounded-lg border border-black/12 bg-white px-4 text-base transition focus:border-[#805a27] focus:outline-none focus:ring-4 focus:ring-[#805a27]/8" type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label>
              <AdminSubmitButton className="mt-1 inline-flex min-h-13 items-center justify-center gap-2 rounded-lg bg-[#173c33] px-5 text-xs font-bold uppercase tracking-[0.13em] text-white transition hover:bg-[#0b2922] disabled:cursor-wait disabled:opacity-70">Send secure link</AdminSubmitButton>
            </form>
          </div>
          <p className="mt-6 text-center text-xs leading-6 text-black/38">Access is logged and sessions automatically expire.</p>
        </div>
      </main>
    </div>
  )
}
