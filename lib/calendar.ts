import { addDays, differenceInCalendarDays, format, isAfter, isBefore, parseISO } from "date-fns"
import { calendarEntrySchema, type CalendarEntry, type CalendarMap } from "@/lib/schemas"

export type CalendarDayStatus = "open" | "checkout-only" | "solid-block"

export type CalendarDateInfo = {
  status: CalendarDayStatus
  minimumStay: number | null
  price: number | null
  reason: string | null
}

function dateKey(date: Date | string) {
  return typeof date === "string" ? date : format(date, "yyyy-MM-dd")
}

function activeReservations(entry: CalendarEntry) {
  return entry.reservations.filter((reservation) => reservation.status?.toLowerCase() !== "cancelled")
}

function entryIsAvailable(entry: CalendarEntry) {
  if (entry.isAvailable !== undefined) return entry.isAvailable === 1
  if (entry.available !== undefined) return entry.available === 1
  return entry.status?.toLowerCase() === "available"
}

function reservationState(date: Date, entry: CalendarEntry) {
  const key = dateKey(date)
  const reservations = activeReservations(entry)
  const isArrival = reservations.some((reservation) => reservation.arrivalDate === key)
  const isDeparture = reservations.some((reservation) => reservation.departureDate === key)
  const isWithinStay = reservations.some((reservation) => {
    const arrival = parseISO(reservation.arrivalDate)
    const departure = parseISO(reservation.departureDate)
    return isAfter(date, arrival) && isBefore(date, departure)
  })
  return { isArrival, isDeparture, isWithinStay }
}

export function normalizeHostawayCalendarResult(result: unknown): CalendarMap {
  const sourceEntries = Array.isArray(result)
    ? result.map((entry) => [undefined, entry] as const)
    : result && typeof result === "object"
      ? Object.entries(result)
      : []
  const calendar: CalendarMap = {}

  for (const [sourceKey, rawEntry] of sourceEntries) {
    if (!rawEntry || typeof rawEntry !== "object") continue
    const candidate = { ...rawEntry, date: Reflect.get(rawEntry, "date") || sourceKey }
    const parsed = calendarEntrySchema.safeParse(candidate)
    if (parsed.success) calendar[parsed.data.date] = parsed.data
  }

  return calendar
}

export function buildNextArrivalMap(calendar: CalendarMap) {
  const map: Record<string, Date | null> = {}
  const dates = Object.keys(calendar).sort()
  let nextArrival: Date | null = null

  for (let index = dates.length - 1; index >= 0; index -= 1) {
    const key = dates[index]
    map[key] = nextArrival
    const hasArrival = activeReservations(calendar[key]).some((reservation) => reservation.arrivalDate === key)
    if (hasArrival) nextArrival = parseISO(key)
  }

  return map
}

export function getCalendarDateInfo(
  date: Date,
  calendar: CalendarMap,
  nextArrivalMap: Record<string, Date | null> = buildNextArrivalMap(calendar),
): CalendarDateInfo {
  const key = dateKey(date)
  const entry = calendar[key]
  if (!entry) return { status: "solid-block", minimumStay: null, price: null, reason: "Availability unavailable" }

  const minimumStay = entry.minimumStay && entry.minimumStay > 0 ? entry.minimumStay : null
  const price = entry.price ?? null
  const { isArrival, isDeparture, isWithinStay } = reservationState(date, entry)
  const available = entryIsAvailable(entry)

  if ((isArrival && isDeparture) || isWithinStay || !available) {
    return { status: "solid-block", minimumStay, price, reason: "Unavailable" }
  }

  const nextArrival = nextArrivalMap[key]
  if (available && minimumStay && nextArrival && differenceInCalendarDays(nextArrival, date) < minimumStay) {
    return {
      status: "checkout-only",
      minimumStay,
      price,
      reason: `A ${minimumStay}-night minimum applies`,
    }
  }

  return { status: "open", minimumStay, price, reason: null }
}

export function isCalendarNightAvailable(date: Date, calendar: CalendarMap) {
  const entry = calendar[dateKey(date)]
  if (!entry) return false
  const { isArrival, isDeparture, isWithinStay } = reservationState(date, entry)
  if ((isArrival && isDeparture) || isWithinStay) return false
  return entryIsAvailable(entry)
}

export function canSelectCheckIn(date: Date, calendar: CalendarMap, nextArrivalMap?: Record<string, Date | null>) {
  return getCalendarDateInfo(date, calendar, nextArrivalMap).status === "open"
}

export function canSelectCheckOut(checkIn: Date, checkOut: Date, calendar: CalendarMap) {
  const nights = differenceInCalendarDays(checkOut, checkIn)
  if (nights < 1) return false
  const minimumStay = calendar[dateKey(checkIn)]?.minimumStay ?? 1
  if (nights < Math.max(minimumStay || 1, 1)) return false

  for (let offset = 0; offset < nights; offset += 1) {
    if (!isCalendarNightAvailable(addDays(checkIn, offset), calendar)) return false
  }

  return true
}

export function buildCheckoutValidityMap(checkIn: Date, calendar: CalendarMap) {
  const validity: Record<string, boolean> = {}
  const lastKey = Object.keys(calendar).sort().at(-1)
  if (!lastKey) return validity

  const finalDate = parseISO(lastKey)
  const finalOffset = differenceInCalendarDays(finalDate, checkIn)
  const minimumStay = Math.max(calendar[dateKey(checkIn)]?.minimumStay || 1, 1)
  let uninterruptedStay = true

  for (let offset = 1; offset <= finalOffset; offset += 1) {
    uninterruptedStay = uninterruptedStay && isCalendarNightAvailable(addDays(checkIn, offset - 1), calendar)
    validity[dateKey(addDays(checkIn, offset))] = uninterruptedStay && offset >= minimumStay
  }

  return validity
}

export function shouldShowCheckoutOnlyCue(info: Pick<CalendarDateInfo, "status"> | null | undefined, validCheckout: boolean) {
  return info?.status === "checkout-only" && !validCheckout
}

export function calendarCoversStay(calendar: CalendarMap, checkIn: string, checkOut: string) {
  return canSelectCheckOut(parseISO(checkIn), parseISO(checkOut), calendar)
}
