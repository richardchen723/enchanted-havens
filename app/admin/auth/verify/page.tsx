import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, KeyRound, Leaf, LockKeyhole, ShieldCheck } from "lucide-react"
import { AdminAccessConfirmation } from "@/components/admin/admin-access-confirmation"
import { getCurrentAdminUser } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

function isPlausibleToken(value: string) {
  return /^[A-Za-z0-9_-]{20,200}$/.test(value)
}

export default async function VerifyAdminAccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (await getCurrentAdminUser()) redirect("/admin/dashboard")
  const query = await searchParams
  const token = typeof query.token === "string" && isPlausibleToken(query.token) ? query.token : ""

  return (
    <div className="grid min-h-dvh bg-[#f3efe6] text-[#16251f] lg:grid-cols-[1fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-[#0b2922] p-12 text-[#f8f4ea] lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute inset-0 opacity-35" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle at 18% 20%, rgba(213,181,120,.35), transparent 24%), radial-gradient(circle at 75% 72%, rgba(90,130,108,.4), transparent 32%)" }} />
        <div className="relative flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full border border-[#d5b578]/45 bg-white/5 text-[#e0c28f]"><Leaf className="size-4" /></span><div><p className="font-display text-2xl leading-none">Enchanted Havens</p><p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.23em] text-white/45">Private admin</p></div></div>
        <div className="relative max-w-xl"><p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#d5b578]">Secure access</p><h1 className="mt-6 font-display text-6xl leading-[0.93] xl:text-7xl">One final step, then you’re home.</h1><p className="mt-7 max-w-md text-base leading-8 text-white/58">Confirm this sign-in from your browser to continue into the private admin portal.</p></div>
        <div className="relative flex items-center gap-3 text-xs text-white/45"><LockKeyhole className="size-4 text-[#d5b578]" /> The link remains single-use and expires automatically</div>
      </section>

      <main className="flex min-h-dvh items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
          <Link href="/admin/login" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#805a27]"><ArrowLeft className="size-4" /> Back to sign in</Link>
          <div className="mt-10 rounded-2xl border border-black/8 bg-[#fbf9f4] p-7 shadow-[0_24px_70px_rgba(23,60,51,.08)] sm:p-9">
            <span className="grid size-12 place-items-center rounded-xl bg-[#173c33] text-[#e0c28f]">{token ? <ShieldCheck className="size-5" /> : <KeyRound className="size-5" />}</span>
            <p className="mt-8 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#97723c]">Admin access</p>
            <h2 className="mt-3 font-display text-5xl leading-none text-[#173c33]">{token ? "Confirm your sign-in." : "This link isn’t valid."}</h2>
            <p className="mt-5 text-sm leading-7 text-black/52">{token ? "Press continue to use this one-time link. This extra step prevents email security checks from signing in before you do." : "The link may be incomplete or expired. Request a fresh email from the admin sign-in page."}</p>
            {token ? (
              <AdminAccessConfirmation token={token} />
            ) : <Link href="/admin/login" className="mt-7 inline-flex min-h-13 w-full items-center justify-center rounded-lg bg-[#173c33] px-5 text-xs font-bold uppercase tracking-[0.13em] text-white">Request a new link</Link>}
          </div>
        </div>
      </main>
    </div>
  )
}
