import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react"
import { ContactForm } from "@/components/contact-form"
import { PageHero } from "@/components/page-hero"
import { TrackedContactLink } from "@/components/tracked-contact-link"
import { BRAND_CONTACT_EMAIL } from "@/lib/brand"
import { getCatalog } from "@/lib/catalog"
import { safeContactReturnPath } from "@/lib/contact-handoff"
import { shareMetadata } from "@/lib/seo-metadata"
import { parseStaySelection } from "@/lib/stay-search"

const CONTACT_HERO_IMAGE = "/images/sea-renity/sea-renity-living-view.webp"

export const metadata: Metadata = shareMetadata({
  title: "Plan Your Stay",
  description: "Let Enchanted Havens help you choose a private Pacific Northwest vacation rental, compare waterfront homes, or plan a special Whidbey Island estate stay.",
  path: "/contact",
  keywords: ["book Pacific Northwest vacation rental direct", "Enchanted Havens contact", "plan Whidbey Island estate stay", "PNW retreat rental inquiry"],
  image: CONTACT_HERO_IMAGE,
  imageAlt: "A sunset ocean view from the living room at Sea-Renity Haven",
  openGraphTitle: "Plan Your Stay | Enchanted Havens",
})

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const catalog = await getCatalog()
  const property = typeof query.property === "string" ? catalog.find((item) => item.slug === query.property) : undefined
  const variant = property && typeof query.variant === "string" ? property.variants.find((item) => item.slug === query.variant) : undefined
  const selection = parseStaySelection(query, 2)
  const checkIn = selection.checkIn
  const checkOut = selection.checkOut
  const guests = typeof query.guests === "string" ? String(selection.guests) : ""
  const requestedTripType = typeof query.tripType === "string" ? query.tripType : ""
  const initialTripType = requestedTripType || (property?.slug === "whidbey-estate" ? "The Cove Club" : property ? "Help choosing a home" : "")
  const selectedName = variant?.shortName || property?.displayName || ""
  const selectedPath = property
    ? property.estate && variant
      ? `/havens/${property.slug}/${variant.slug}`
      : `/havens/${property.slug}`
    : "/havens"
  const returnQuery = new URLSearchParams()
  if (checkIn && checkOut) {
    returnQuery.set("checkIn", checkIn)
    returnQuery.set("checkOut", checkOut)
  }
  if (guests) returnQuery.set("guests", guests)
  const fallbackReturnPath = `${selectedPath}${returnQuery.size ? `?${returnQuery.toString()}` : ""}${property ? "#reserve" : ""}`
  const returnPath = safeContactReturnPath(query.returnTo, fallbackReturnPath)
  const dateSummary = checkIn && checkOut
    ? `${format(parseISO(checkIn), "MMM d")}–${format(parseISO(checkOut), "MMM d, yyyy")}`
    : "Dates flexible"
  const initialMessage = property
    ? `I'm interested in ${selectedName}.${checkIn && checkOut ? `\nDates: ${dateSummary}.` : "\nDates: Flexible."}${guests ? `\nGuests: ${guests}.` : ""}\n\nPlease help me plan this stay.`
    : ""
  const planningSteps = [
    ["01", "Tell us the shape of the trip."],
    ["02", "We match the right haven, dates, and details."],
    ["03", "You arrive with clarity before the drive begins."],
  ] as const
  return (
    <>
      {property ? (
        <section className="immersive-hero relative isolate min-h-[23rem] overflow-hidden bg-[#071e19] text-white sm:min-h-[27rem]">
          <Image src={variant?.images[0] || property.heroImage} alt={`${selectedName} inquiry`} fill loading="eager" sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071e19]/94 via-[#071e19]/76 to-[#071e19]/28" aria-hidden="true" />
          <div className="container-shell relative flex min-h-[23rem] items-end pb-9 pt-32 sm:min-h-[27rem] sm:pb-12">
            <div className="max-w-3xl">
              <p className="eyebrow text-[#d4b47d]">Your Selected Stay</p>
              <h1 className="display-balance mt-4 font-display text-5xl leading-[0.9] sm:text-7xl">Request {selectedName}.</h1>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/72">
                <span className="flex items-center gap-2"><CalendarDays className="size-4 text-[#d4b47d]" /> {dateSummary}</span>
                {guests ? <span className="flex items-center gap-2"><Users className="size-4 text-[#d4b47d]" /> {guests} {guests === "1" ? "guest" : "guests"}</span> : null}
                <span className="flex items-center gap-2"><MapPin className="size-4 text-[#d4b47d]" /> {property.location}</span>
              </div>
              <Link href={returnPath} className="mt-6 inline-flex min-h-11 items-center gap-2 text-[0.67rem] font-bold uppercase tracking-[0.14em] text-white/72 transition hover:text-white"><ArrowLeft className="size-4" /> Return to {selectedName}</Link>
            </div>
          </div>
        </section>
      ) : (
        <PageHero
          eyebrow="Plan Your Stay"
          title="Tell us what you want to remember."
          body="Choosing between a lake, the ocean, and a private estate is a lovely problem. Share the shape of your trip and we will guide you toward the right haven."
          image={CONTACT_HERO_IMAGE}
        />
      )}
      <section className={`bg-[#faf7f0] ${property ? "py-10 sm:py-14 lg:py-20" : "py-14 sm:py-20 lg:py-28"}`}>
        <div className="container-shell grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-14">
          <div className="order-2 lg:order-1">
            <p className="eyebrow text-[#805a27]">{property ? "A Direct Handoff" : "A Personal Introduction"}</p>
            <h2 className="mt-4 font-display text-5xl leading-none text-[#173c33]">{property ? "Your stay details are already with us." : "We know every home in the collection."}</h2>
            <p className="mt-6 text-base leading-8 text-black/58">{property ? "The haven, dates, and group size you selected have been carried into the inquiry. Add only the details that would help us guide you personally." : "Ask about the best swimming, the quietest setting, a milestone gathering, pet-friendly options, or which house makes the most sense for your group."}</p>
            <div className="mt-9 grid gap-4 border-y border-black/10 py-6">
              {planningSteps.map(([number, text]) => <p key={number} className="flex gap-4 text-sm leading-7 text-black/62"><span className="font-bold uppercase tracking-[0.16em] text-[#805a27]">{number}</span><span>{text}</span></p>)}
            </div>
            <div className="mt-7 text-sm leading-7 text-black/60">
              <p>Existing reservation?</p>
              <p className="mt-1 text-[#173c33]">Include your confirmation reference so our stay team can help quickly.</p>
              <TrackedContactLink className="mt-4 inline-block underline decoration-[#805a27]/40 underline-offset-4 transition hover:text-[#173c33]" href={`mailto:${BRAND_CONTACT_EMAIL}`} eventName="Email Contact Clicked" location="contact-page">{BRAND_CONTACT_EMAIL}</TrackedContactLink>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow mb-5 text-[#805a27]">{property ? `Inquiry for ${selectedName}` : "Start your inquiry"}</p>
            {property ? (
              <div data-testid="inquiry-stay-context" className="mb-6 flex flex-col gap-4 border border-[#173c33]/12 bg-[#f3eee3] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-3xl leading-none text-[#173c33]">{selectedName}</p>
                  <p className="mt-3 text-sm text-black/60">{dateSummary}{guests ? ` · ${guests} ${guests === "1" ? "guest" : "guests"}` : ""}</p>
                </div>
                <Link href={returnPath} className="inline-flex min-h-11 items-center gap-2 self-start text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#173c33] sm:self-auto"><ArrowLeft className="size-4" /> Adjust stay</Link>
              </div>
            ) : null}
            <ContactForm initialTripType={initialTripType} initialMessage={initialMessage} />
          </div>
        </div>
      </section>
    </>
  )
}
