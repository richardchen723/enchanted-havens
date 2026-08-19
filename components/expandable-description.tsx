"use client"

import { ChevronDown } from "lucide-react"
import { useId, useState } from "react"

export function ExpandableDescription({ summary, description }: { summary: string; description: string }) {
  const [expanded, setExpanded] = useState(false)
  const descriptionId = useId()
  const hasMore = description.trim() !== "" && description.trim() !== summary.trim()

  return (
    <div className="mt-7 max-w-3xl">
      <p className="font-display text-3xl leading-tight text-[#173c33]/88 sm:text-4xl">{summary}</p>
      {hasMore && expanded ? (
        <div id={descriptionId} className="mt-7 whitespace-pre-line border-t border-black/10 pt-7 text-base leading-8 text-black/62">
          {description}
        </div>
      ) : null}
      {hasMore ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={descriptionId}
          onClick={() => setExpanded((current) => !current)}
          className="mt-7 inline-flex min-h-11 items-center gap-3 border border-[#173c33]/24 px-4 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#173c33] transition hover:border-[#173c33]"
        >
          {expanded ? "Read Less" : "Read More"}
          <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}
