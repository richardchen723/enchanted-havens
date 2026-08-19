import { nightsBetween } from "@/lib/utils"

export type RawSearchParams = Record<string, string | string[] | undefined>

export type StaySelection = {
  checkIn: string
  checkOut: string
  guests: number
}

const attributionParameter = /^(utm_[a-z0-9_]+|gclid|fbclid|msclkid)$/i
const intentParameter = /^(intent|matches|experience)$/i
const isoDate = /^\d{4}-\d{2}-\d{2}$/

function singleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : ""
}

export function parseStaySelection(params: RawSearchParams, defaultGuests = 1): StaySelection {
  const candidateCheckIn = singleValue(params.checkIn)
  const candidateCheckOut = singleValue(params.checkOut)
  const validDates = isoDate.test(candidateCheckIn) &&
    isoDate.test(candidateCheckOut) &&
    nightsBetween(candidateCheckIn, candidateCheckOut) > 0
  const parsedGuests = Number(singleValue(params.guests))

  return {
    checkIn: validDates ? candidateCheckIn : "",
    checkOut: validDates ? candidateCheckOut : "",
    guests: Number.isInteger(parsedGuests) && parsedGuests > 0
      ? Math.min(parsedGuests, 60)
      : Math.max(1, defaultGuests),
  }
}

export function buildStayQuery(params: RawSearchParams, selection: StaySelection) {
  const query = new URLSearchParams()
  if (selection.checkIn && selection.checkOut) {
    query.set("checkIn", selection.checkIn)
    query.set("checkOut", selection.checkOut)
  }
  if ((selection.checkIn && selection.checkOut) || singleValue(params.guests)) {
    query.set("guests", String(selection.guests))
  }

  for (const [key, value] of Object.entries(params)) {
    if (!attributionParameter.test(key) && !intentParameter.test(key)) continue
    const item = singleValue(value)
    if (item) query.set(key, item)
  }

  return query.toString()
}

export function appendQuery(path: string, query: string) {
  if (!query) return path
  return `${path}${path.includes("?") ? "&" : "?"}${query}`
}
