import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Compass } from "lucide-react"
import { BRAND_HERO_URL } from "@/lib/editorial"

export default function NotFound() {
  return (
    <section className="immersive-hero relative min-h-[88dvh] overflow-hidden bg-[#071e19] text-white">
      <Image src={BRAND_HERO_URL} alt="Pacific Northwest mountain lake" fill loading="eager" quality={90} sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,24,19,.82),rgba(4,24,19,.2)_78%),linear-gradient(0deg,rgba(4,24,19,.7),transparent_65%)]" />
      <div className="grain absolute inset-0 opacity-25" />
      <div className="container-shell relative flex min-h-[88dvh] items-end pb-16 pt-36 sm:pb-20">
        <div className="max-w-3xl"><p className="eyebrow text-[#d4b47d]">A Turn in the Trail · 404</p><h1 className="display-balance mt-5 font-display text-7xl leading-[0.84] sm:text-8xl">This path does not lead to a haven.</h1><p className="copy-balance mt-7 max-w-xl text-base leading-8 text-white/68">The page may have moved, but the Northwest is still waiting. Return to the collection or let us help you find the right stay.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/havens" className="button-light">Explore the Collection <ArrowRight className="size-4" /></Link><Link href="/contact" className="button-outline text-white"><Compass className="size-4" /> Ask the Stay Team</Link></div></div>
      </div>
    </section>
  )
}
