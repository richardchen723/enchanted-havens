import { ChevronDown } from "lucide-react"

export function ExpandableDescription({ summary, description }: { summary: string; description: string }) {
  const hasMore = description.trim() !== "" && description.trim() !== summary.trim()

  return (
    <div className="mt-7 max-w-3xl">
      <p className="font-display text-3xl leading-tight text-[#173c33]/88 sm:text-4xl">{summary}</p>
      {hasMore ? (
        <details className="group mt-7">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-3 border border-[#173c33]/24 px-4 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#173c33] transition marker:content-none hover:border-[#173c33] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#173c33]">
            <span className="group-open:hidden">Read More</span>
            <span className="hidden group-open:inline">Read Less</span>
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-7 whitespace-pre-line border-t border-black/10 pt-7 text-base leading-8 text-black/62">
            {description}
          </div>
        </details>
      ) : null}
    </div>
  )
}
