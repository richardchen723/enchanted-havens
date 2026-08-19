type LegalSection = { title: string; body: string[] }

export function LegalPage({ eyebrow, title, introduction, lastUpdated, contactEmail, sections }: { eyebrow: string; title: string; introduction: string; lastUpdated: string; contactEmail: string; sections: LegalSection[] }) {
  return (
    <section className="bg-[#faf7f0] py-20 lg:py-28">
      <article className="container-shell grid gap-12 lg:grid-cols-[0.38fr_1fr] lg:gap-24">
        <header className="lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow text-[#805a27]">{eyebrow}</p>
          <h1 className="mt-4 font-display text-6xl leading-[0.9] text-[#173c33] sm:text-7xl">{title}</h1>
          <p className="mt-7 text-sm leading-7 text-black/60">{introduction}</p>
          <div className="mt-8 border-y border-black/10 py-5 text-xs leading-6 text-black/55">
            <p><strong className="text-[#173c33]">Last updated</strong><br />{lastUpdated}</p>
            <p className="mt-4"><strong className="text-[#173c33]">Questions</strong><br /><a className="underline decoration-[#805a27]/40 underline-offset-4 transition hover:text-[#173c33]" href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
          </div>
        </header>
        <div className="border-t border-black/10">
          {sections.map((section, index) => <section key={section.title} className="grid gap-5 border-b border-black/10 py-9 sm:grid-cols-[3rem_1fr]"><p className="eyebrow pt-1 text-[#805a27]">0{index + 1}</p><div><h2 className="font-display text-3xl text-[#173c33]">{section.title}</h2><div className="mt-4 space-y-4 text-sm leading-7 text-black/60">{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></div></section>)}
        </div>
      </article>
    </section>
  )
}
