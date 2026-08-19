"use client"

import Link from "next/link"
import { Menu, Phone, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { InstagramBrandIcon } from "@/components/instagram-brand-icon"
import { TrackedContactLink } from "@/components/tracked-contact-link"
import { BRAND_CONTACT_PHONE, BRAND_CONTACT_PHONE_DISPLAY, BRAND_INSTAGRAM_URL } from "@/lib/brand"
import { LOGO_DATA_URL } from "@/lib/logo-data"

const links = [
  ["The Havens", "/havens"],
  ["The Cove Club", "/havens/whidbey-estate"],
  ["Experiences", "/experiences"],
  ["Our Story", "/story"],
  ["Contact", "/contact"],
] as const

function isActivePath(pathname: string, href: string) {
  if (href === "/havens") return pathname === "/havens" || (pathname.startsWith("/havens/") && !pathname.startsWith("/havens/whidbey-estate"))
  if (href === "/havens/whidbey-estate") return pathname.startsWith("/havens/whidbey-estate")
  if (href === "/experiences") return pathname.startsWith("/experiences")
  return pathname === href
}

function isImmersive(pathname: string) {
  return pathname === "/" || pathname.startsWith("/havens") || pathname.startsWith("/destinations") || pathname.startsWith("/stays") || pathname.startsWith("/groups") || pathname.startsWith("/amenities") || pathname.startsWith("/experiences") || pathname === "/story" || pathname === "/contact"
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)
  const overImage = isImmersive(pathname) && !scrolled && !open
  const seamlessHomeHero = pathname === "/" && overImage

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 32)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        window.requestAnimationFrame(() => menuButtonRef.current?.focus())
        return
      }
      if (event.key !== "Tab" || !headerRef.current) return
      const focusable = [...headerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((item) => item.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1) || first
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.body.style.overflow = "hidden"
    const isolated = [document.getElementById("main-content"), document.querySelector("footer")].filter((element): element is HTMLElement => element instanceof HTMLElement)
    isolated.forEach((element) => element.setAttribute("inert", ""))
    window.requestAnimationFrame(() => mobileNavRef.current?.querySelector<HTMLElement>("a[href]")?.focus())
    window.addEventListener("keydown", handleKeydown)
    return () => {
      document.body.style.overflow = previousOverflow
      isolated.forEach((element) => element.removeAttribute("inert"))
      window.removeEventListener("keydown", handleKeydown)
    }
  }, [open])

  return (
    <header ref={headerRef} className={`fixed inset-x-0 top-0 z-50 h-[var(--header-height)] transition-all duration-300 ${seamlessHomeHero ? "border-b-0" : "border-b"} ${overImage ? "border-white/15 bg-transparent text-white" : "border-black/8 bg-[#faf7f0]/94 text-[#173c33] shadow-[0_8px_40px_rgba(7,30,25,.06)] backdrop-blur-xl"}`}>
      <div className="container-shell flex h-full items-center justify-between gap-6">
        <Link href="/" aria-label="Enchanted Havens home" className={`relative h-14 w-28 shrink-0 transition duration-300 ${overImage ? "brightness-0 invert" : ""}`}>
          <span aria-hidden="true" className="absolute inset-0 bg-contain bg-left bg-no-repeat" style={{ backgroundImage: `url(${LOGO_DATA_URL})` }} />
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-5 xl:gap-7 lg:flex">
          {links.map(([label, href]) => {
            const active = isActivePath(pathname, href)
            return (
              <Link key={href} href={href} className={`relative py-2 text-[0.67rem] font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-55 ${active ? "after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-current" : ""}`}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <TrackedContactLink
            href={`tel:${BRAND_CONTACT_PHONE}`}
            eventName="Phone Contact Clicked"
            location="header-desktop"
            aria-label={`Call Enchanted Havens at ${BRAND_CONTACT_PHONE_DISPLAY}`}
            className={`hidden min-h-10 items-center justify-center gap-2 px-2 text-[0.67rem] font-bold tracking-[0.08em] transition-opacity hover:opacity-55 lg:inline-flex xl:px-0 ${overImage ? "text-white" : "text-[#173c33]"}`}
          >
            <Phone className="size-3.5" />
            <span className="hidden xl:inline">{BRAND_CONTACT_PHONE_DISPLAY}</span>
          </TrackedContactLink>
          <a
            href={BRAND_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Enchanted Havens on Instagram (opens in a new tab)"
            className={`grid size-11 shrink-0 place-items-center transition-opacity hover:opacity-55 ${overImage ? "text-white" : "text-[#173c33]"}`}
          >
            <InstagramBrandIcon className="size-[1.05rem]" />
          </a>
          <TrackedContactLink
            href={`tel:${BRAND_CONTACT_PHONE}`}
            eventName="Phone Contact Clicked"
            location="header-mobile"
            aria-label={`Call Enchanted Havens at ${BRAND_CONTACT_PHONE_DISPLAY}`}
            className="grid size-11 place-items-center lg:hidden"
          >
            <Phone className="size-5" />
          </TrackedContactLink>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
            className="grid size-12 place-items-center lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav ref={mobileNavRef} id="mobile-navigation" aria-label="Mobile navigation" className="fixed inset-x-0 top-[var(--header-height)] max-h-[calc(100dvh-var(--header-height))] min-h-[calc(100dvh-var(--header-height))] overflow-y-auto border-t border-black/8 bg-[#faf7f0] px-5 py-10 text-[#173c33] lg:hidden">
          <p className="eyebrow text-[#805a27]">Explore Enchanted Havens</p>
          <div className="mt-7 flex flex-col border-t border-black/10">
            {links.map(([label, href], index) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="group flex items-center justify-between border-b border-black/10 py-5 font-display text-[2.25rem] leading-none">
                <span>{label}</span><span className="font-sans text-[0.62rem] tracking-[0.18em] text-black/60">0{index + 1}</span>
              </Link>
            ))}
          </div>
          <TrackedContactLink href={`tel:${BRAND_CONTACT_PHONE}`} eventName="Phone Contact Clicked" location="mobile-menu" onClick={() => setOpen(false)} className="mt-6 inline-flex items-center gap-3 border-t border-black/10 pt-6 text-sm font-semibold">
            <Phone className="size-4 text-[#805a27]" /> Call {BRAND_CONTACT_PHONE_DISPLAY}
          </TrackedContactLink>
          <p className="mt-8 max-w-xs text-sm leading-6 text-black/60">Rare waterfront homes and private retreats across Washington.</p>
        </nav>
      )}
    </header>
  )
}
