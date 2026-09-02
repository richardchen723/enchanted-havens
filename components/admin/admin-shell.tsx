import { format } from "date-fns"
import { ArrowUpRight, BedDouble, House, Leaf, LogOut, Settings, Users } from "lucide-react"
import Link from "next/link"
import { signOutAdminAction } from "@/app/admin/actions"
import type { AdminUser } from "@/lib/admin-auth"

type AdminSection = "overview" | "properties" | "team"

const navigation = [
  { id: "overview" as const, label: "Overview", icon: House, href: "/admin/dashboard" },
  { id: "properties" as const, label: "Properties", icon: BedDouble, href: "/admin/properties" },
  { id: "team" as const, label: "Team", icon: Users, href: "/admin/dashboard#team" },
]

export function adminInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "EH"
}

export function AdminShell({ viewer, active, children }: { viewer: AdminUser; active: AdminSection; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f3efe6] text-[#16251f]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-[#0b2922] text-[#f8f4ea] lg:flex">
        <div className="flex h-24 items-center gap-3 border-b border-white/10 px-7">
          <span className="grid size-10 place-items-center rounded-full border border-[#c9a66b]/45 bg-white/5 text-[#e0c28f]"><Leaf className="size-4" /></span>
          <div><p className="font-display text-xl leading-none">Enchanted Havens</p><p className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-white/45">Private admin</p></div>
        </div>
        <nav aria-label="Admin navigation" className="flex-1 px-4 py-7">
          <p className="px-3 text-[0.58rem] font-bold uppercase tracking-[0.22em] text-[#d5b578]">Workspace</p>
          <div className="mt-4 grid gap-1.5">
            {navigation.map((item) => {
              const Icon = item.icon
              const current = item.id === active
              return <Link key={item.id} href={item.href} aria-current={current ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition ${current ? "bg-white/10 text-white" : "text-white/58 hover:bg-white/5 hover:text-white"}`}><Icon className="size-4" /><span>{item.label}</span></Link>
            })}
          </div>
        </nav>
        <div className="border-t border-white/10 p-4">
          <Link href="/admin/dashboard#team" className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-white/58 transition hover:bg-white/5 hover:text-white"><Settings className="size-4" />Settings</Link>
          <form action={signOutAdminAction}><button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-white/58 transition hover:bg-white/5 hover:text-white"><LogOut className="size-4" />Sign out</button></form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-black/8 bg-[#f8f5ee]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div><p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#97723c]">Admin portal</p><p className="mt-1 hidden text-sm text-black/48 sm:block">{format(new Date(), "EEEE, MMMM d")}</p></div>
          <div className="flex items-center gap-3"><Link href="/" className="hidden min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-xs font-semibold sm:inline-flex">View website <ArrowUpRight className="size-3.5" /></Link><div className="grid size-10 place-items-center rounded-full bg-[#173c33] text-xs font-bold text-[#f3eee3]" title={viewer.fullName}>{adminInitials(viewer.fullName)}</div></div>
        </header>
        <nav aria-label="Admin navigation" className="sticky top-20 z-20 grid grid-cols-3 border-b border-black/8 bg-[#f8f5ee] px-3 lg:hidden">
          {navigation.map((item) => {
            const Icon = item.icon
            const current = item.id === active
            return <Link key={item.id} href={item.href} aria-current={current ? "page" : undefined} className={`flex min-h-12 items-center justify-center gap-2 text-xs font-semibold ${current ? "text-[#173c33]" : "text-black/42"}`}><Icon className="size-3.5" />{item.label}</Link>
          })}
        </nav>
        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10"><div className="mx-auto max-w-6xl">{children}</div></main>
      </div>
    </div>
  )
}
