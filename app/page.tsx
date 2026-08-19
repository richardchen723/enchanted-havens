import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react"
import { HomeHeroCarousel } from "@/components/home-hero-carousel"
import { InstagramBrandIcon } from "@/components/instagram-brand-icon"
import { PropertyCard } from "@/components/property-card"
import { SearchForm } from "@/components/search-form"
import { SectionHeading } from "@/components/section-heading"
import { TrackedEventLink } from "@/components/tracked-contact-link"
import { BRAND_INSTAGRAM_URL } from "@/lib/brand"
import { getCatalog } from "@/lib/catalog"
import { BRAND_HERO_URL, experienceTiles, getEditorialVariantHero, homeHeroSlides } from "@/lib/editorial"
import { getAirbnbReviewSummary } from "@/lib/airbnb"
import { buildHomeJsonLd, HOME_DESCRIPTION, HOME_OG_IMAGE, HOME_TITLE, homeFaq, homeKeywords } from "@/lib/home-seo"
import { shareMetadata } from "@/lib/seo-metadata"
import { formatCount } from "@/lib/utils"

const HERO_SLIDE_INTERVAL_SECONDS = 5
const homeCollectionSlugs = ["blue-haven", "sea-renity-haven", "emerald-haven", "fair-haven", "aurora-haven", "reflection-haven", "whidbey-estate"]

export const metadata: Metadata = shareMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  keywords: homeKeywords,
  image: HOME_OG_IMAGE,
  imageAlt: "Pacific Northwest private vacation rental views with Enchanted Havens",
  openGraphTitle: "Pacific Northwest Vacation Rentals | Enchanted Havens",
})

export default async function HomePage() {
  const catalog = await getCatalog()
  const featured = homeCollectionSlugs.flatMap((slug) => {
    const property = catalog.find((item) => item.slug === slug)
    if (!property) return []
    return [property]
  })
  const supportingFeatured = featured.slice(1)
  const featuredBySlug = new Map(featured.map((property) => [property.slug, property]))
  const heroSlides = homeHeroSlides.length
    ? homeHeroSlides
    : [{ name: "Enchanted Havens", image: BRAND_HERO_URL, position: "50% 50%" }]
  const hero = catalog.find((property) => property.slug === "emerald-haven") || catalog[0]
  const estate = catalog.find((property) => property.slug === "whidbey-estate") || catalog[catalog.length - 1]
  const estateFeatureVariant = estate.variants.find((variant) => variant.slug === "full-estate")
  const estateFeature = estate.heroImage || (estateFeatureVariant && getEditorialVariantHero(estateFeatureVariant.id)) || BRAND_HERO_URL
  const estateGuestCopy = estateFeatureVariant ? `Up to ${formatCount(estateFeatureVariant.guests, "guest")}` : "Private estate"
  const estateStayCopy = `${formatCount(estate.variants.length, "way")} to stay`
  const airbnbSummary = getAirbnbReviewSummary(catalog.flatMap((property) => property.variants.map((variant) => variant.id)))
  const socialImages = [
    featuredBySlug.get("blue-haven")?.heroImage,
    featuredBySlug.get("sea-renity-haven")?.gallery[1],
    featuredBySlug.get("emerald-haven")?.gallery[0],
    featuredBySlug.get("fair-haven")?.gallery[0],
    featuredBySlug.get("aurora-haven")?.heroImage,
    featuredBySlug.get("reflection-haven")?.gallery[0],
    featuredBySlug.get("sea-renity-haven")?.gallery[4],
    featuredBySlug.get("whidbey-estate")?.heroImage,
  ].filter((image): image is string => Boolean(image))
  const schema = buildHomeJsonLd({ catalog, reviews: [] })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />

      <section className="immersive-hero relative min-h-[100dvh] overflow-hidden bg-[#071e19] text-white">
        <HomeHeroCarousel slides={heroSlides} intervalSeconds={HERO_SLIDE_INTERVAL_SECONDS} />
        <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(4,21,17,.72),rgba(4,21,17,.18)_66%,rgba(4,21,17,.18)),linear-gradient(0deg,rgba(4,21,17,.65),transparent_62%)] sm:bg-[linear-gradient(90deg,rgba(4,21,17,.7),rgba(4,21,17,.04)_74%,rgba(4,21,17,.18)),linear-gradient(0deg,rgba(4,21,17,.56),transparent_58%)]" />
        <div className="grain absolute inset-0 z-10 opacity-30" />

        <div className="container-shell relative z-20 flex min-h-[100dvh] flex-col justify-end pb-20 pt-32 sm:pb-24 lg:pb-32">
          <div className="hero-reveal max-w-[72rem]">
            <p className="eyebrow mb-5 text-[#d4b47d] sm:mb-7">Private retreats across the Pacific Northwest</p>
            <h1 className="display-balance font-display text-[clamp(3.9rem,7.4vw,7.4rem)] leading-[0.82] tracking-[-0.045em]">
              The Pacific Northwest,<br /><em className="font-normal">privately yours.</em>
            </h1>
          </div>

          <div className="hero-reveal-delay mt-7 grid items-end gap-7 pt-6 lg:grid-cols-[1fr_auto]">
            <p className="copy-balance max-w-xl text-sm leading-7 text-white/72 sm:text-base sm:leading-8">Rare homes at the edge of lakes, forests, and the sea. Curated for privacy, beauty, and the kind of time that stays with you.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/havens" className="button-outline text-white">Explore the Collection</Link>
            </div>
          </div>
          <a href="#find" aria-label="Scroll to availability search" className="absolute bottom-9 right-0 hidden items-center gap-3 text-[0.61rem] font-bold uppercase tracking-[0.2em] text-white/60 xl:flex">Begin <ArrowDown className="size-4" /></a>
        </div>
      </section>

      <section id="find" className="relative z-10 border-b border-[#173c33]/8 bg-[linear-gradient(180deg,#e7e1d6_0%,#f3eee3_100%)] pb-10 lg:pb-14">
        <div className="container-shell -mb-8 -translate-y-8">
          <SearchForm />
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-28">
        <div className="container-shell">
          <div className="grid items-end gap-9 lg:grid-cols-[1fr_auto]">
            <SectionHeading eyebrow="The Collection" title="Not more places. The right ones." body="Each home is chosen for an exceptional relationship to water, forest, mountain, or sea, then cared for with the consistency of a private resort." />
            <Link href="/havens" className="button-outline text-[#173c33]">View All Havens <ArrowRight className="size-4" /></Link>
          </div>

          <div className="mt-14 lg:mt-16">
            {featured[0] && <PropertyCard property={featured[0]} layout="feature" />}
          </div>
          <div className="mt-12 grid gap-x-7 gap-y-12 lg:mt-16 lg:grid-cols-3">
            {supportingFeatured.slice(0, 3).map((property) => <PropertyCard key={property.slug} property={property} />)}
          </div>
          {supportingFeatured.length > 3 && (
            <div className="mt-12 grid gap-x-7 gap-y-12 lg:grid-cols-3">
              {supportingFeatured.slice(3).map((property) => <PropertyCard key={property.slug} property={property} />)}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden bg-[#173c33] py-20 text-[#f3eee3] lg:py-28">
        <div className="container-shell grid gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="relative">
            <div className="image-lift relative aspect-[4/5] overflow-hidden">
              <Image src={catalog.find((property) => property.slug === "blue-haven")?.gallery[2] || hero.gallery[0]} alt="A quiet moment beside the water at Enchanted Havens" fill sizes="(max-width: 1024px) 100vw, 43vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-8 -right-3 max-w-[15rem] bg-[#f3eee3] p-5 text-[#173c33] sm:-right-8 sm:p-7">
              <p className="font-display text-2xl leading-tight">“Luxury, here, is space to notice where you are.”</p>
            </div>
          </div>
          <div className="lg:pl-14">
            <p className="eyebrow mb-5 text-[#d4b47d]">The Enchanted Standard</p>
            <h2 className="display-balance font-display text-5xl leading-[0.92] sm:text-7xl lg:text-[5.6rem]">Not simply a place to stay. <em>A way to arrive.</em></h2>
            <p className="copy-balance mt-8 max-w-2xl text-base leading-8 text-white/64 sm:text-lg sm:leading-9">We curate homes that deepen your relationship with the landscape: a dock at first light, a hot tub under cedar boughs, a long table facing the ocean. Thoughtful design and attentive hospitality make everything beyond the view feel effortless.</p>
            <div className="mt-10 grid gap-5 border-y border-white/14 py-7 sm:grid-cols-3">
              {["Rare settings", "Considered design", "Human hospitality"].map((value, index) => <div key={value}><p className="text-[0.61rem] font-bold uppercase tracking-[0.18em] text-[#d4b47d]">0{index + 1}</p><p className="mt-2 font-display text-xl text-white/88">{value}</p></div>)}
            </div>
            <Link href="/story" className="button-outline mt-9 text-white">Our Story <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f3eee3] py-20 lg:py-28">
        <div className="container-shell">
          <SectionHeading eyebrow="Ways to Be Here" title="Follow the feeling." body="Come for the water, the stillness, the celebration, or all three." align="center" />
          <div className="mt-14 grid gap-5 lg:grid-cols-[1fr_1.12fr_1fr]">
            {experienceTiles.map((tile, index) => (
              <Link key={tile.title} href={tile.href} className={`image-lift group relative overflow-hidden ${index === 1 ? "lg:-translate-y-5" : ""}`}>
                <div className={`relative ${index === 1 ? "aspect-[3/4] lg:aspect-[0.7]" : "aspect-[3/4]"}`}>
                  <Image src={tile.image} alt={tile.title} fill sizes="(max-width: 1024px) 100vw, 34vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071e19]/85 via-[#071e19]/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-8">
                    <p className="eyebrow mb-3 text-[#d4b47d]">0{index + 1}</p>
                    <h3 className="font-display text-4xl leading-none sm:text-5xl">{tile.title}</h3>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">{tile.text}</p>
                    <p className="mt-6 inline-flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.16em]">Explore <ArrowRight className="size-4 transition group-hover:translate-x-1" /></p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="immersive-panel relative min-h-[48rem] overflow-hidden text-white">
        <Image src={estateFeature} alt="The private waterfront setting of The Cove Club" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,30,25,.82),rgba(7,30,25,.12)_72%),linear-gradient(0deg,rgba(7,30,25,.5),transparent)]" />
        <div className="grain absolute inset-0 opacity-25" />
        <div className="container-shell relative flex min-h-[48rem] items-center py-24">
          <div className="max-w-3xl">
            <p className="eyebrow mb-5 text-[#d4b47d]">The Collection’s Private Estate</p>
            <h2 className="display-balance font-display text-6xl leading-[0.88] sm:text-7xl lg:text-[6.2rem]">Twenty-three acres. One private world.</h2>
            <p className="copy-balance mt-7 max-w-xl text-base leading-8 text-white/70 sm:text-lg">Choose an intimate residence, a grand gathering house, or reserve the entire waterfront estate on Whidbey Island.</p>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/58"><span>Gated waterfront</span><span>{estateStayCopy}</span><span>{estateGuestCopy}</span></div>
            <Link href="/havens/whidbey-estate" className="button-light mt-9">Discover The Cove Club <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-28">
        <div className="container-shell">
          <div className="grid gap-12 lg:grid-cols-[0.35fr_1fr] lg:gap-20">
            <div>
              <p className="eyebrow text-[#805a27]">Verified Guest Proof</p>
              <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33] sm:text-6xl">Reviews kept where guests wrote them.</h2>
              <p className="mt-6 text-sm leading-7 text-black/60">We link directly to Airbnb so each rating stays with its original listing and booking context.</p>
            </div>
            <div className="border-y border-black/10 py-9">
              {airbnbSummary ? <div className="grid gap-8 sm:grid-cols-[0.7fr_1.3fr] sm:items-center"><div><p className="font-display text-7xl leading-none text-[#173c33]">{airbnbSummary.rating.toFixed(2)}</p><p className="mt-3 text-[#805a27]" aria-label={`${airbnbSummary.rating.toFixed(2)} out of 5 stars`}>★★★★★</p><p className="mt-3 text-xs font-semibold text-black/60">{formatCount(airbnbSummary.reviewCount, "verified Airbnb review")}</p></div><div><p className="font-display text-3xl leading-snug text-[#173c33]">Check the current ratings, guest comments, and listing-specific review history directly on Airbnb.</p><TrackedEventLink href={airbnbSummary.href} target="_blank" rel="noopener noreferrer" eventName="Airbnb Reviews Clicked" data={{ location: "homepage" }} className="button-outline mt-6 text-[#173c33]">Check verified Airbnb reviews <ArrowRight className="size-4" /></TrackedEventLink><p className="mt-4 text-xs leading-5 text-black/55">Snapshot checked {airbnbSummary.checkedAt}. Enchanted Havens is independent and is not endorsed by Airbnb.</p></div></div> : <p className="text-sm leading-7 text-black/60">Verified review history is available directly on our Airbnb profile.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#e7e1d6] py-24 lg:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="eyebrow text-[#805a27]">Why Book Directly</p>
            <h2 className="display-balance mt-4 font-display text-5xl leading-[0.94] text-[#173c33] sm:text-6xl">A more personal way to stay.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-black/65">Clear pricing, secure card storage, and a team who knows every haven beyond its amenity list.</p>
          </div>
          <div className="grid gap-7 sm:grid-cols-3">
            {[{ icon: ShieldCheck, title: "Secure", text: "Your inquiry and reservation details are handled directly by the Enchanted Havens team." }, { icon: Sparkles, title: "Attentive", text: "Reach a stay team who knows the homes and can help shape your trip." }, { icon: Check, title: "Transparent", text: "See live availability and the complete stay total before confirming." }].map((item) => (
              <div key={item.title} className="border-t border-[#173c33]/22 pt-6"><item.icon className="size-5 text-[#805a27]" /><h3 className="mt-5 font-display text-3xl text-[#173c33]">{item.title}</h3><p className="mt-3 text-sm leading-7 text-black/65">{item.text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f3eee3] py-20 lg:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#805a27]">Planning Questions</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33] sm:text-6xl">A clearer path to the right haven.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-black/60">The best direct booking starts before the date picker: choosing the right setting, group fit, rules, and stay rhythm.</p>
          </div>
          <div className="border-t border-black/10">
            {homeFaq.map((item) => (
              <details key={item.question} className="group border-b border-black/10 py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-2xl leading-tight text-[#173c33]">
                  {item.question}
                  <span className="grid size-8 shrink-0 place-items-center border border-[#173c33]/20 text-sm transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#faf7f0] py-20 lg:py-24">
        <div className="container-shell flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow text-[#805a27]">From the Havens</p><h2 className="mt-3 font-display text-5xl text-[#173c33]">A slower view of the Northwest.</h2></div>
          <a href={BRAND_INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="button-outline text-[#173c33]"><InstagramBrandIcon className="size-4" /> @enchanted.havens</a>
        </div>
        <div className="container-shell mt-10 grid grid-cols-2 gap-2 md:grid-cols-4 md:grid-rows-2">
          {socialImages.map((image, index) => <div key={`${image}-${index}`} className={`image-lift relative overflow-hidden ${index === 0 || index === 5 ? "aspect-square md:row-span-2 md:aspect-auto" : "aspect-square"}`}><Image src={image} alt="Enchanted Havens property and guest experience" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" /></div>)}
        </div>
      </section>
    </>
  )
}
