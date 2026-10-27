import { searchRequestSchema } from "@/lib/schemas"
import { nightsBetween } from "@/lib/utils"

export const STAY_LIMITS = { maxNights: 90, maxAdvanceDays: 730, requestsPerMinute: 20, quoteLifetimeSeconds: 300 } as const
export const stayResponseHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Vary": "Cookie" }

export class StayRequestError extends Error {
  constructor(message: string, public status = 400, public code = "invalid_request") { super(message) }
}

export function validatePublicStay(value: unknown, now = new Date()) {
  const result = searchRequestSchema.safeParse(value)
  if (!result.success) throw new StayRequestError("Provide valid checkIn and checkOut dates (YYYY-MM-DD) and an integer guest count from 1 to 60.")
  const input = result.data
  const nights = nightsBetween(input.checkIn, input.checkOut)
  // The properties use Pacific calendar dates, independent of the caller's locale.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
  if (nights < 1 || nights > STAY_LIMITS.maxNights || input.checkIn < today || nightsBetween(today, input.checkOut) > STAY_LIMITS.maxAdvanceDays) {
    throw new StayRequestError(`Choose a future stay of 1–${STAY_LIMITS.maxNights} nights, ending within ${STAY_LIMITS.maxAdvanceDays} days. Contact the stay team for other dates.`)
  }
  return input
}

// Bounded per-instance abuse protection. Production edge/WAF limits can layer
// across instances; this does not claim to be a distributed rate limiter.
const windows = new Map<string, { count: number; until: number }>()
export function limitStayRequests(request: Request, now = Date.now()) {
  for (const [key, value] of windows) if (value.until <= now) windows.delete(key)
  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown").slice(0,100)
  const current = windows.get(ip)
  if ((current && current.count >= STAY_LIMITS.requestsPerMinute) || (!current && windows.size >= 10000)) {
    throw new StayRequestError("Too many availability requests. Please retry in one minute.", 429, "rate_limited")
  }
  windows.set(ip, current ? { ...current, count: current.count + 1 } : { count: 1, until: now + 60000 })
}

export async function readStayBody(request: Request) {
  if (Number(request.headers.get("content-length")) > 4096) throw new StayRequestError("Request body is too large.", 413)
  if (!request.body) throw new StayRequestError("A JSON request body is required.")
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.length
    if (size > 4096) { await reader.cancel(); throw new StayRequestError("Request body is too large.", 413) }
    chunks.push(value)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown } catch { throw new StayRequestError("Provide a valid JSON request body.") }
}

export function stayErrorResponse(error: unknown) {
  const known = error instanceof StayRequestError
  const status = known ? error.status : 503
  return Response.json({ status: status >= 500 ? "unknown" : "invalid_request", code: known ? error.code : "temporarily_unknown", error: known ? error.message : "Availability could not be confirmed. Please retry or contact the stay team." }, {
    status, headers: { ...stayResponseHeaders, ...(status === 429 || status === 503 ? { "Retry-After": "60" } : {}) },
  })
}
