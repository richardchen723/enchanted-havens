import Image from "next/image"

export function PageHero({ eyebrow, title, body, image, imagePosition = "center" }: { eyebrow: string; title: string; body?: string; image?: string; imagePosition?: string }) {
  return (
    <section className={`relative overflow-hidden ${image ? "immersive-hero min-h-[31rem] text-white sm:min-h-[40rem]" : "bg-[#173c33] py-24 text-white lg:py-32"}`}>
      {image && <><Image src={image} alt="" fill loading="eager" quality={82} sizes="100vw" className="object-cover" style={{ objectPosition: imagePosition }} /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,24,19,.82),rgba(4,24,19,.12)_74%),linear-gradient(0deg,rgba(4,24,19,.72),transparent_62%)]" /><div className="grain absolute inset-0 opacity-20" /></>}
      <div className={`container-shell relative ${image ? "flex min-h-[31rem] items-end pb-12 pt-32 sm:min-h-[40rem] sm:pb-20 sm:pt-36" : ""}`}>
        <div className="max-w-4xl">
          <p className="hero-reveal eyebrow mb-5 text-[#d4b47d]">{eyebrow}</p>
          <h1 className="hero-reveal display-balance font-display text-[clamp(3.8rem,7.5vw,7.5rem)] leading-[0.86] tracking-[-0.035em]">{title}</h1>
          {body && <p className="hero-reveal-delay copy-balance mt-7 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">{body}</p>}
        </div>
      </div>
    </section>
  )
}
