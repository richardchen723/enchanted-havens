"use client"

import { ArrowRight, CalendarDays } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function OpenDatePickerButton({
  targetId,
  label = "Choose dates",
  className,
}: {
  targetId: string
  label?: string
  className?: string
}) {
  const [opening, setOpening] = useState(false)

  function openCalendar() {
    if (opening) return
    const trigger = document.getElementById(targetId)
    if (!(trigger instanceof HTMLButtonElement)) return

    setOpening(true)
    trigger.click()
    window.setTimeout(() => setOpening(false), 250)
  }

  return (
    <button
      type="button"
      onClick={openCalendar}
      disabled={opening}
      aria-busy={opening}
      aria-controls="stay-date-dialog"
      className={cn("inline-flex items-center gap-2 disabled:cursor-wait", className)}
    >
      {opening ? <CalendarDays className="size-4 animate-pulse" /> : null}
      {opening ? "Opening dates..." : label}
      {!opening ? <ArrowRight className="size-4" /> : null}
    </button>
  )
}
