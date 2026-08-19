import { ArrowUpRight, MapPin } from "lucide-react"
import type { PropertyVariant } from "@/lib/schemas"

function roundedCoordinate(value: number) {
  return Math.round(value * 100) / 100
}

export function PropertyMap({ variant, location, locationSummary }: { variant: PropertyVariant; location: string; locationSummary?: string }) {
  const hasCoordinates = typeof variant.latitude === "number" && typeof variant.longitude === "number"
  const query = hasCoordinates
    ? `${roundedCoordinate(variant.latitude as number)},${roundedCoordinate(variant.longitude as number)}`
    : `${variant.city}, ${variant.region}` || location
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=11&output=embed`
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

  return (
    <section id="location" aria-labelledby="location-heading" className="border-b border-black/10 py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[#805a27]">Location</p>
          <h2 id="location-heading" className="mt-3 font-display text-4xl leading-none text-[#173c33]">Near {location}.</h2>
        </div>
        <a href={mapHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.13em] text-[#173c33] transition hover:text-[#805a27]">
          Open in Google Maps <ArrowUpRight className="size-4" />
        </a>
      </div>

      <div className="relative mt-7 overflow-hidden border border-black/10 bg-[#dbe2dd]">
        <iframe
          title={`Approximate location of ${variant.shortName}`}
          src={mapSrc}
          className="h-[22rem] w-full border-0 grayscale-[0.12] sm:h-[27rem]"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="pointer-events-none absolute bottom-4 left-4 flex max-w-[calc(100%-2rem)] items-start gap-3 bg-[#fffdf8]/95 px-4 py-3 shadow-[0_16px_40px_rgba(7,30,25,.16)] backdrop-blur-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#805a27]" aria-hidden="true" />
          <p className="text-xs leading-5 text-black/62"><strong className="font-bold text-[#173c33]">Approximate location.</strong> The exact arrival address is shared with confirmed guests.</p>
        </div>
      </div>
      {locationSummary ? <p className="mt-5 max-w-3xl text-sm leading-7 text-black/60">{locationSummary}</p> : null}
    </section>
  )
}
