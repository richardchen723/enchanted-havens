"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

type GuestCountControlProps = {
  value: number
  onChange: (value: number) => void
  max: number
  min?: number
  name?: string
  appearance?: "field" | "search" | "filter" | "stay"
  ariaLabel?: string
  label?: string
}

const appearanceClasses = {
  field: "min-h-[3.6rem] grid-cols-[3.25rem_1fr_3.25rem] border-black/16 bg-[#faf7f0] hover:border-[#805a27]/70 hover:bg-white",
  search: "min-h-[5.25rem] grid-cols-[3.25rem_1fr_3.25rem] border-0 bg-transparent",
  filter: "min-h-11 min-w-36 grid-cols-[2.75rem_1fr_2.75rem] border-black/14 bg-[#faf7f0] hover:border-[#805a27]/70 hover:bg-white",
  stay: "min-h-[4.5rem] grid-cols-[3.25rem_1fr_3.25rem] border-black/14 bg-[#faf7f0] hover:border-[#805a27]/70 hover:bg-white",
}

export function GuestCountControl({ value, onChange, max, min = 1, name, appearance = "field", ariaLabel = "Guests", label }: GuestCountControlProps) {
  const update = (nextValue: number) => onChange(Math.min(max, Math.max(min, nextValue)))

  return (
    <div role="group" aria-label={ariaLabel} className={cn("grid w-full overflow-hidden border text-[#173c33] transition", appearanceClasses[appearance])}>
      {name && <input type="hidden" name={name} value={value} />}
      <button type="button" aria-label="Decrease guest count" disabled={value <= min} onClick={() => update(value - 1)} className="grid min-h-10 place-items-center border-r border-black/10 transition hover:bg-[#f3eee3] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#805a27] disabled:cursor-not-allowed disabled:opacity-25">
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <span className="flex flex-col items-center justify-center whitespace-nowrap">
        {label && <span className="eyebrow text-[#805a27]">{label}</span>}
        <span aria-live="polite" className={cn("font-medium", appearance === "search" || appearance === "stay" ? "text-sm" : "text-base", label && "mt-2")}>
          {value} {value === 1 ? "guest" : "guests"}
        </span>
      </span>
      <button type="button" aria-label="Increase guest count" disabled={value >= max} onClick={() => update(value + 1)} className="grid min-h-10 place-items-center border-l border-black/10 transition hover:bg-[#f3eee3] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#805a27] disabled:cursor-not-allowed disabled:opacity-25">
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
