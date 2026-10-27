import { getVerifiedPropertyFacts, propertyFactDetails } from "@/lib/property-facts"

export function PropertyFacts({ listingId }: { listingId: number }) {
  const facts = getVerifiedPropertyFacts(listingId)
  if (!facts) return null

  return (
    <section id="property-details" aria-labelledby="property-details-heading" className="scroll-mt-24 border-b border-black/10 py-12">
      <p className="eyebrow text-[#805a27]">Plan Your Stay</p>
      <h2 id="property-details-heading" className="mt-3 font-display text-4xl leading-none text-[#173c33]">The details that matter.</h2>
      <dl className="mt-7 divide-y divide-black/10 border-y border-black/10">
        {propertyFactDetails(facts).map((detail) => (
          <div key={detail.label} className="grid gap-2 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
            <dt className="text-sm font-semibold text-[#173c33]">{detail.label}</dt>
            <dd className="text-sm leading-7 text-black/64">{detail.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
