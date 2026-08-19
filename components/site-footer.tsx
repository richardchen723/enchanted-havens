import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import { Mail, Phone } from "lucide-react"
import { InstagramBrandIcon } from "@/components/instagram-brand-icon"
import { TrackedContactLink } from "@/components/tracked-contact-link"
import { BRAND_CONTACT_EMAIL, BRAND_CONTACT_PHONE, BRAND_CONTACT_PHONE_DISPLAY, BRAND_INSTAGRAM_URL } from "@/lib/brand"
import { LOGO_URL } from "@/lib/editorial"

const exploreLinks = [
  ["The Havens", "/havens"],
  ["The Cove Club", "/havens/whidbey-estate"],
  ["Experiences", "/experiences"],
  ["Our Story", "/story"],
  ["Contact", "/contact"],
] as const

const featuredHavenLinks = [
  ["Blue Haven", "/havens/blue-haven"],
  ["Sea-Renity Haven", "/havens/sea-renity-haven"],
  ["Emerald Haven", "/havens/emerald-haven"],
  ["Fair Haven", "/havens/fair-haven"],
  ["Aurora Haven", "/havens/aurora-haven"],
  ["Reflection Haven", "/havens/reflection-haven"],
  ["Reflection Point", "/havens/reflection-point"],
] as const

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="transition hover:text-white">{children}</Link>
}

export function SiteFooter() {
  return (
    <footer className="bg-[#071e19] text-[#f3eee3]">
      <div className="border-b border-white/10">
        <div className="container-shell py-16 sm:py-20">
          <div><p className="eyebrow text-[#d4b47d]">Your Northwest, Waiting</p><h2 className="display-balance mt-5 max-w-4xl font-display text-5xl leading-[0.92] sm:text-7xl lg:text-[5.6rem]">Leave the ordinary somewhere behind you.</h2></div>
        </div>
      </div>

      <div className="container-shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.15fr_0.55fr_0.7fr_0.72fr] lg:py-20">
        <div>
          <div className="relative mb-7 h-20 w-40 brightness-0 invert">
            <Image src={LOGO_URL} alt="Enchanted Havens" fill sizes="160px" className="object-contain object-left" />
          </div>
          <p className="max-w-md font-display text-3xl leading-tight text-white">The Pacific Northwest, privately yours.</p>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/70">Rare waterfront homes, restorative landscapes, and hospitality shaped around the way you want to feel.</p>
          <div className="mt-8">
            <p className="eyebrow text-[#d4b47d]">Follow Along</p>
            <a href={BRAND_INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Follow Enchanted Havens on Instagram (opens in a new tab)" className="group mt-4 inline-flex items-center gap-3 text-white/72 transition hover:text-white">
              <InstagramBrandIcon className="size-[1.2rem] shrink-0 transition-transform group-hover:scale-110" />
              <span>
                <span className="block text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[#d4b47d]">Instagram</span>
                <span className="mt-1 block text-sm">@enchanted.havens</span>
              </span>
            </a>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-6 text-[#d4b47d]">Explore</p>
          <div className="grid gap-4 text-sm text-white/70">
            {exploreLinks.map(([label, href]) => <FooterLink key={href} href={href}>{label}</FooterLink>)}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-6 text-[#d4b47d]">Featured Havens</p>
          <div className="grid gap-3 text-sm text-white/70">
            {featuredHavenLinks.map(([label, href]) => <FooterLink key={href} href={href}>{label}</FooterLink>)}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-6 text-[#d4b47d]">Plan Your Stay</p>
          <div className="grid gap-3 text-sm text-white/72">
            <FooterLink href="/contact">Contact the stay team</FooterLink>
            <TrackedContactLink href={`tel:${BRAND_CONTACT_PHONE}`} eventName="Phone Contact Clicked" location="footer" className="inline-flex items-center gap-3 transition hover:text-white">
              <Phone className="size-4 shrink-0 text-[#d4b47d]" /> {BRAND_CONTACT_PHONE_DISPLAY}
            </TrackedContactLink>
            <TrackedContactLink href={`mailto:${BRAND_CONTACT_EMAIL}`} eventName="Email Contact Clicked" location="footer" className="inline-flex items-center gap-3 break-all transition hover:text-white">
              <Mail className="size-4 shrink-0 text-[#d4b47d]" /> {BRAND_CONTACT_EMAIL}
            </TrackedContactLink>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col gap-4 py-6 text-[0.68rem] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Enchanted Havens. All rights reserved.</p>
          <div className="flex gap-6"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
        </div>
      </div>
    </footer>
  )
}
