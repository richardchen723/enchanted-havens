"use client"

import { addDays, addMonths, differenceInCalendarDays, endOfMonth, format, isAfter, isBefore, isSameDay, parseISO, startOfDay, startOfMonth } from "date-fns"
import { CalendarDays, ChevronLeft, ChevronRight, LoaderCircle, RotateCcw, X } from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames, type NavProps } from "react-day-picker"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { buildCheckoutValidityMap, buildNextArrivalMap, canSelectCheckIn, getCalendarDateInfo, shouldShowCheckoutOnlyCue } from "@/lib/calendar"
import type { CalendarMap } from "@/lib/schemas"
import { cn } from "@/lib/utils"

type DateRangePickerProps = {
  checkIn: string
  checkOut: string
  onChange: (checkIn: string, checkOut: string) => void
  listingId?: number
  appearance?: "field" | "search"
  className?: string
  arrivalButtonId?: string
  onOpenChange?: (open: boolean) => void
}

function displayDate(value: string, placeholder: string) {
  return value ? format(parseISO(value), "MMM d, yyyy") : placeholder
}

type CalendarNavigationContextValue = {
  busy: boolean
  navigate: (month: Date, action: () => void) => void
}

const CalendarNavigationContext = createContext<CalendarNavigationContextValue | null>(null)

function CalendarNav({ onPreviousClick, onNextClick, previousMonth, nextMonth, ...props }: NavProps) {
  const navigation = useContext(CalendarNavigationContext)
  if (!navigation) return <nav {...props} />

  const buttonClassName = "pointer-events-auto grid size-12 touch-manipulation select-none place-items-center rounded-full border border-black/12 bg-white text-[#173c33] shadow-[0_3px_12px_rgba(7,30,25,.07)] transition active:scale-[0.96] active:bg-[#e8e0d1] disabled:cursor-not-allowed disabled:opacity-30"

  return (
    <nav {...props} className={cn("pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between", props.className)}>
      <button
        type="button"
        className={cn("rdp-button_previous", buttonClassName)}
        disabled={navigation.busy || !previousMonth}
        aria-label={previousMonth ? `Previous month, ${format(previousMonth, "MMMM yyyy")}` : "Previous month unavailable"}
        onClick={(event) => previousMonth && navigation.navigate(previousMonth, () => onPreviousClick?.(event))}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        className={cn("rdp-button_next", buttonClassName)}
        disabled={navigation.busy || !nextMonth}
        aria-label={nextMonth ? `Next month, ${format(nextMonth, "MMMM yyyy")}` : "Next month unavailable"}
        onClick={(event) => nextMonth && navigation.navigate(nextMonth, () => onNextClick?.(event))}
      >
        <ChevronRight className="size-5" />
      </button>
    </nav>
  )
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  listingId,
  appearance = "field",
  className,
  arrivalButtonId,
  onOpenChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [activeField, setActiveField] = useState<"arrival" | "departure">("arrival")
  const [calendar, setCalendar] = useState<CalendarMap>({})
  const [availabilityState, setAvailabilityState] = useState<"search" | "loading" | "live" | "unavailable">(
    listingId ? "loading" : "search",
  )
  const [availabilityMessage, setAvailabilityMessage] = useState("")
  const [calendarRequested, setCalendarRequested] = useState(false)
  const [wideCalendar, setWideCalendar] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [navigationPending, setNavigationPending] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const arrivalButtonRef = useRef<HTMLButtonElement>(null)
  const departureButtonRef = useRef<HTMLButtonElement>(null)
  const navigationLockRef = useRef(false)
  const navigationTimerRef = useRef<number | null>(null)
  const today = useMemo(() => startOfDay(new Date()), [])
  const lastCalendarDate = useMemo(() => endOfMonth(addMonths(today, 18)), [today])
  const liveCalendar = availabilityState === "live" && Object.keys(calendar).length > 0
  const selectingCheckout = activeField === "departure" && Boolean(checkIn)
  const nextArrivalMap = useMemo(() => buildNextArrivalMap(calendar), [calendar])
  const selectedArrival = useMemo(() => checkIn ? parseISO(checkIn) : null, [checkIn])
  const checkoutValidityMap = useMemo(
    () => selectingCheckout && liveCalendar && selectedArrival
      ? buildCheckoutValidityMap(selectedArrival, calendar)
      : {},
    [calendar, liveCalendar, selectedArrival, selectingCheckout],
  )
  const selectedMinimumStay = selectedArrival
    ? Math.max(calendar[format(selectedArrival, "yyyy-MM-dd")]?.minimumStay || 1, 1)
    : 1
  const earliestDeparture = selectedArrival ? addDays(selectedArrival, selectedMinimumStay) : null
  const requestCalendar = useCallback(() => {
    if (listingId) setCalendarRequested(true)
  }, [listingId])

  useEffect(() => {
    onOpenChange?.(open)
  }, [onOpenChange, open])

  function openCalendar(field: "arrival" | "departure") {
    requestCalendar()
    setActiveField(field === "departure" && !checkIn ? "arrival" : field)
    const targetMonth = field === "departure" && checkOut
      ? parseISO(checkOut)
      : checkIn
        ? parseISO(checkIn)
        : today
    setVisibleMonth(startOfMonth(targetMonth))
    setOpen(true)
  }

  const navigateCalendar = useCallback((month: Date, action: () => void) => {
    if (navigationLockRef.current) return
    navigationLockRef.current = true
    setNavigationPending(true)
    setVisibleMonth(startOfMonth(month))
    action()
    if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current)
    navigationTimerRef.current = window.setTimeout(() => {
      navigationLockRef.current = false
      setNavigationPending(false)
      navigationTimerRef.current = null
    }, 320)
  }, [])

  useEffect(() => () => {
    if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current)
  }, [])

  useEffect(() => {
    if (!listingId || calendarRequested) return

    let idleId: number | undefined
    const warmupTimer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(requestCalendar, { timeout: 1_500 })
      } else {
        requestCalendar()
      }
    }, 800)

    return () => {
      window.clearTimeout(warmupTimer)
      if (idleId !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId)
    }
  }, [calendarRequested, listingId, requestCalendar])

  const closeCalendar = useCallback(() => {
    setOpen(false)
    window.requestAnimationFrame(() => {
      const trigger = activeField === "departure" ? departureButtonRef.current : arrivalButtonRef.current
      trigger?.focus({ preventScroll: true })
    })
  }, [activeField])

  function clearDates() {
    onChange("", "")
    setActiveField("arrival")
  }

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const update = () => setWideCalendar(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!listingId || !calendarRequested) return
    const controller = new AbortController()
    const startDate = format(today, "yyyy-MM-dd")
    const endDate = format(lastCalendarDate, "yyyy-MM-dd")

    async function loadCalendar() {
      setAvailabilityState("loading")
      setAvailabilityMessage("")
      try {
        const response = await fetch(`/api/calendar/${listingId}?startDate=${startDate}&endDate=${endDate}`, {
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Live availability could not be loaded.")
        setCalendar(data.calendar || {})
        setAvailabilityState("live")
      } catch (error) {
        if (controller.signal.aborted) return
        setCalendar({})
        setAvailabilityState("unavailable")
        setAvailabilityMessage(error instanceof Error ? error.message : "Live availability could not be loaded.")
      }
    }

    loadCalendar()
    return () => controller.abort()
  }, [calendarRequested, lastCalendarDate, listingId, today])

  useEffect(() => {
    if (!open) return
    const focusFrame = window.requestAnimationFrame(() => dialogRef.current?.focus({ preventScroll: true }))
    const isolated = [document.querySelector("header"), document.getElementById("main-content"), document.querySelector("footer")]
      .filter((element): element is HTMLElement => element instanceof HTMLElement)
    isolated.forEach((element) => element.setAttribute("inert", ""))
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (!containerRef.current?.contains(target) && !dialogRef.current?.contains(target)) closeCalendar()
    }
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCalendar()
        return
      }
      if (event.key !== "Tab" || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.offsetParent !== null)
      if (!focusable.length) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", handleDialogKeys)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      isolated.forEach((element) => element.removeAttribute("inert"))
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", handleDialogKeys)
    }
  }, [closeCalendar, open])

  const dateIsDisabled = useCallback((date: Date) => {
    const normalized = startOfDay(date)
    if (isBefore(normalized, today) || isBefore(lastCalendarDate, normalized)) return true

    if (selectingCheckout) {
      const arrival = selectedArrival!
      if (isSameDay(normalized, arrival)) return false
      if (isBefore(normalized, arrival)) return true
      return liveCalendar ? !checkoutValidityMap[format(normalized, "yyyy-MM-dd")] : false
    }

    return liveCalendar ? !canSelectCheckIn(normalized, calendar, nextArrivalMap) : false
  }, [calendar, checkoutValidityMap, lastCalendarDate, liveCalendar, nextArrivalMap, selectedArrival, selectingCheckout, today])

  const handleDayClick = useCallback((date: Date, modifiers: Record<string, boolean>) => {
    if (modifiers.disabled) return
    const value = format(date, "yyyy-MM-dd")

    if (selectingCheckout) {
      const arrival = selectedArrival!
      if (isSameDay(date, arrival)) return
      if (!liveCalendar || checkoutValidityMap[value]) {
        closeCalendar()
        setActiveField("arrival")
        onChange(checkIn, value)
      }
      return
    }

    onChange(value, "")
    setActiveField("departure")
  }, [checkIn, checkoutValidityMap, closeCalendar, liveCalendar, onChange, selectedArrival, selectingCheckout])

  const CalendarDay = useCallback((props: React.ComponentProps<typeof DayButton>) => {
    const info = liveCalendar ? getCalendarDateInfo(props.day.date, calendar, nextArrivalMap) : null
    const pendingArrival = Boolean(checkIn && !checkOut && isSameDay(props.day.date, parseISO(checkIn)))
    const afterArrival = Boolean(selectingCheckout && selectedArrival && isAfter(props.day.date, selectedArrival))
    const validCheckout = Boolean(
      afterArrival &&
      (!liveCalendar || checkoutValidityMap[format(props.day.date, "yyyy-MM-dd")]),
    )
    const minimumStayBlocked = Boolean(
      afterArrival &&
      selectedArrival &&
      !validCheckout &&
      differenceInCalendarDays(props.day.date, selectedArrival) < selectedMinimumStay,
    )
    const endpoint = props.modifiers.range_start || props.modifiers.range_end || pendingArrival
    const selectedMiddle = props.modifiers.range_middle
    const unavailable = info?.status === "solid-block" && !validCheckout
    const checkoutOnly = shouldShowCheckoutOnlyCue(info, validCheckout)

    return (
      <DayButton
        {...props}
        title={validCheckout
          ? "Available for departure"
          : minimumStayBlocked
            ? `${selectedMinimumStay}-night minimum; choose ${format(earliestDeparture!, "MMM d")} or later`
            : info?.reason || undefined}
        data-testid={`calendar-day-${format(props.day.date, "yyyy-MM-dd")}`}
        className={cn(
          props.className,
          "relative z-10 grid size-10 touch-manipulation place-items-center rounded-full text-sm font-medium text-[#27312e] transition-colors hover:bg-[#e8e0d1] focus-visible:outline-2 focus-visible:outline-[#805a27]",
          props.modifiers.today && "font-bold text-[#805a27] ring-1 ring-inset ring-[#805a27]/45",
          unavailable && "text-black/24 after:absolute after:left-2 after:right-2 after:top-1/2 after:h-px after:-rotate-45 after:bg-black/22 hover:bg-transparent",
          minimumStayBlocked && "text-black/25 hover:bg-transparent",
          checkoutOnly && "text-black/48 underline decoration-[#805a27] underline-offset-4",
          selectedMiddle && "rounded-none bg-[#e6ddcb] text-[#173c33] hover:bg-[#ded2bb]",
          endpoint && "bg-[#173c33] text-white ring-0 hover:bg-[#0d2c25]",
          props.modifiers.disabled && !endpoint && "cursor-not-allowed hover:bg-transparent",
        )}
      />
    )
  }, [calendar, checkIn, checkOut, checkoutValidityMap, earliestDeparture, liveCalendar, nextArrivalMap, selectedArrival, selectedMinimumStay, selectingCheckout])

  const defaultClassNames = getDefaultClassNames()
  const selected = checkIn
    ? { from: parseISO(checkIn), to: checkOut ? parseISO(checkOut) : undefined }
    : undefined
  const statusLabel = availabilityState === "live"
    ? "Live availability"
    : availabilityState === "loading"
      ? "Updating available dates"
      : availabilityState === "search"
        ? "Search across the collection"
        : "Availability verified before pricing"

  return (
    <div ref={containerRef} className={cn("relative", className)} data-availability-source={availabilityState}>
      <div
        className={cn(
          "grid w-full grid-cols-2 overflow-hidden text-left transition focus-visible:outline-2 focus-visible:outline-[#805a27]",
          appearance === "field"
            ? "min-h-[4.5rem] border border-black/14 bg-[#faf7f0] hover:border-[#805a27]/70 hover:bg-white"
            : "min-h-[5.25rem] bg-[#fffdf8] hover:bg-[#f3eee3]",
        )}
      >
        <button
          ref={arrivalButtonRef}
          id={arrivalButtonId}
          type="button"
          aria-haspopup="dialog"
          aria-controls="stay-date-dialog"
          aria-expanded={open && activeField === "arrival"}
          aria-label={`Arrival, ${displayDate(checkIn, "Add date")}`}
          onFocus={requestCalendar}
          onPointerEnter={requestCalendar}
          onClick={() => openCalendar("arrival")}
          className={cn(
            "relative flex flex-col justify-center border-r border-black/9 px-4 py-3 text-left transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#805a27] sm:px-5",
            open && activeField === "arrival" && "bg-white",
          )}
        >
          <span className="eyebrow text-[#805a27]">Arrival</span>
          <span className={cn("mt-2 text-sm", checkIn ? "text-[#18221f]" : "text-black/60")}>{displayDate(checkIn, "Add date")}</span>
        </button>
        <button
          ref={departureButtonRef}
          type="button"
          aria-haspopup="dialog"
          aria-controls="stay-date-dialog"
          aria-expanded={open && activeField === "departure"}
          aria-label={`Departure, ${displayDate(checkOut, "Add date")}`}
          onFocus={requestCalendar}
          onPointerEnter={requestCalendar}
          onClick={() => openCalendar("departure")}
          className={cn(
            "relative flex flex-col justify-center px-4 py-3 pr-10 text-left transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[#805a27] sm:px-5 sm:pr-12",
            open && activeField === "departure" && "bg-white",
          )}
        >
          <span className="eyebrow text-[#805a27]">Departure</span>
          <span className={cn("mt-2 text-sm", checkOut ? "text-[#18221f]" : "text-black/60")}>{displayDate(checkOut, "Add date")}</span>
          <CalendarDays className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#805a27]" />
        </button>
      </div>

      {open && createPortal(
        <>
          <button type="button" aria-label="Close calendar" onClick={closeCalendar} className="fixed inset-0 z-[110] touch-manipulation bg-[#071e19]/42 md:backdrop-blur-[2px]" />
          <div
            ref={dialogRef}
            id="stay-date-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Choose stay dates"
            tabIndex={-1}
            className={cn(
              "fixed left-1/2 top-1/2 z-[120] w-[43rem] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-black/10 bg-[#faf7f0] p-5 shadow-[0_30px_100px_rgba(7,30,25,.32)] sm:p-6",
            )}
          >
            <div className="flex items-start justify-between gap-5 border-b border-black/9 pb-5">
              <div>
                <p className="eyebrow text-[#805a27]">Choose Your Stay</p>
                <p className="mt-2 font-display text-2xl text-[#173c33]">{selectingCheckout ? "Now choose your departure." : "When would you like to arrive?"}</p>
              </div>
              <button type="button" aria-label="Close calendar" onClick={closeCalendar} className="grid size-9 shrink-0 touch-manipulation place-items-center rounded-full border border-black/10 text-[#173c33] transition hover:bg-white"><X className="size-4" /></button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-black/45" aria-live="polite">
              {availabilityState === "loading" ? <LoaderCircle className="size-3.5 animate-spin text-[#805a27]" /> : <span className={cn("size-2 rounded-full", availabilityState === "live" ? "bg-[#3f755f]" : "bg-[#805a27]")} />}
              {statusLabel}
            </div>

            {selectingCheckout && earliestDeparture && (
              <p className="mt-3 border-l-2 border-[#805a27] pl-3 text-xs leading-5 text-[#173c33]" aria-live="polite">
                {selectedMinimumStay > 1
                  ? `${selectedMinimumStay}-night minimum. Choose ${format(earliestDeparture, "MMM d")} or a later available date.`
                  : "Choose an available departure date."}
              </p>
            )}

            <div data-testid="calendar-month-status" className="mt-4 flex min-h-5 items-center justify-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#173c33]" aria-live="polite" aria-atomic="true">
              {navigationPending ? <LoaderCircle className="size-3.5 animate-spin text-[#805a27]" /> : <CalendarDays className="size-3.5 text-[#805a27]" />}
              {navigationPending ? `Opening ${format(visibleMonth, "MMMM yyyy")}` : `Viewing ${format(visibleMonth, "MMMM yyyy")}`}
            </div>

            <CalendarNavigationContext.Provider value={{ busy: navigationPending, navigate: navigateCalendar }}>
              <DayPicker
                mode="range"
                selected={selected}
                onSelect={() => undefined}
                onDayClick={handleDayClick}
                disabled={dateIsDisabled}
                startMonth={startOfMonth(today)}
                endMonth={lastCalendarDate}
                month={visibleMonth}
                onMonthChange={setVisibleMonth}
                numberOfMonths={wideCalendar ? 2 : 1}
                showOutsideDays={false}
                fixedWeeks
                excludeDisabled
                components={{
                  DayButton: CalendarDay,
                  Nav: CalendarNav,
                }}
                formatters={{ formatWeekdayName: (date) => format(date, "EEEEE") }}
                className="mt-2"
                classNames={{
                  root: cn("relative", defaultClassNames.root),
                  months: cn("relative flex flex-col gap-8 md:flex-row md:gap-10", defaultClassNames.months),
                  month: cn("min-w-0 flex-1", defaultClassNames.month),
                  month_caption: cn("flex h-12 items-center justify-center", defaultClassNames.month_caption),
                  caption_label: cn("font-display text-2xl text-[#173c33]", defaultClassNames.caption_label),
                  nav: cn("pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between", defaultClassNames.nav),
                  month_grid: cn("mt-3 w-full border-collapse", defaultClassNames.month_grid),
                  weekdays: cn("grid grid-cols-7", defaultClassNames.weekdays),
                  weekday: cn("py-2 text-center text-[0.62rem] font-bold uppercase tracking-[0.12em] text-black/34", defaultClassNames.weekday),
                  weeks: cn("mt-1 block", defaultClassNames.weeks),
                  week: cn("mt-1 grid grid-cols-7", defaultClassNames.week),
                  day: cn("relative grid min-h-10 place-items-center p-0", defaultClassNames.day),
                  day_button: cn("size-10", defaultClassNames.day_button),
                  range_middle: cn("bg-[#e6ddcb]", defaultClassNames.range_middle),
                  range_start: cn("rounded-l-full bg-[#e6ddcb]", defaultClassNames.range_start),
                  range_end: cn("rounded-r-full bg-[#e6ddcb]", defaultClassNames.range_end),
                  outside: cn("invisible", defaultClassNames.outside),
                  disabled: cn("cursor-not-allowed", defaultClassNames.disabled),
                  hidden: cn("invisible", defaultClassNames.hidden),
                }}
              />
            </CalendarNavigationContext.Provider>

            {availabilityMessage && <p className="mt-4 border border-[#805a27]/25 bg-white px-4 py-3 text-xs leading-5 text-black/52">{availabilityMessage} Dates can still be selected and will be verified before pricing.</p>}

            <div className="mt-5 flex flex-col gap-4 border-t border-black/9 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.65rem] text-black/45">
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#3f755f]" /> Available</span>
                {liveCalendar && <span className="flex items-center gap-2"><span className="relative size-3 after:absolute after:left-0 after:right-0 after:top-1/2 after:h-px after:-rotate-45 after:bg-black/35" /> Unavailable</span>}
                {liveCalendar && <span className="flex items-center gap-2"><span className="w-3 border-b border-[#805a27]" /> Departure only</span>}
                <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-[#173c33]" /> Selected</span>
              </div>
              {(checkIn || checkOut) && <button type="button" onClick={clearDates} className="inline-flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.13em] text-[#173c33]"><RotateCcw className="size-3.5" /> Clear dates</button>}
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}
