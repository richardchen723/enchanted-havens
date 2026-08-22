export const GUEST_CHAT_RETRY_DELAYS_MS = [500, 1_000, 2_000] as const
export const GUEST_CHAT_REQUEST_TIMEOUT_MS = 5_000

export type GuestChatConnectionReason =
  | "offline"
  | "timeout"
  | "network"
  | "server"
  | "rate_limited"
  | "request"
  | "unknown"

export class GuestChatRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "GuestChatRequestError"
    this.status = status
  }
}

type RetryFailure = {
  attempt: number
  error: unknown
  maxAttempts: number
  willRetry: boolean
}

type RetryOptions = {
  retryDelaysMs?: readonly number[]
  shouldRetry?: (error: unknown) => boolean
  onFailure?: (failure: RetryFailure) => void
  sleep?: (delayMs: number) => Promise<void>
}

export async function retryGuestChatRequest<T>(
  task: (attempt: number) => Promise<T>,
  {
    retryDelaysMs = GUEST_CHAT_RETRY_DELAYS_MS,
    shouldRetry = isRetryableGuestChatError,
    onFailure,
    sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
  }: RetryOptions = {},
) {
  const maxAttempts = retryDelaysMs.length + 1

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return { value: await task(attempt), attempts: attempt }
    } catch (error) {
      const willRetry = attempt < maxAttempts && shouldRetry(error)
      onFailure?.({ attempt, error, maxAttempts, willRetry })
      if (!willRetry) throw error
      await sleep(retryDelaysMs[attempt - 1])
    }
  }

  throw new Error("Guest chat retry loop ended unexpectedly")
}

export function getGuestChatErrorStatus(error: unknown) {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === "number" ? status : null
}

export function isRetryableGuestChatError(error: unknown) {
  const status = getGuestChatErrorStatus(error)
  if (status === null) return true
  return status === 408 || status === 429 || status >= 500
}

export function classifyGuestChatConnectionError(error: unknown, online = true): GuestChatConnectionReason {
  if (!online) return "offline"

  const typed = error as { message?: unknown; name?: unknown } | null
  if (typed?.name === "AbortError") return "timeout"

  const status = getGuestChatErrorStatus(error)
  if (status === 429) return "rate_limited"
  if (status !== null && status >= 500) return "server"
  if (status !== null) return "request"

  const message = typeof typed?.message === "string" ? typed.message : ""
  if (error instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(message)) return "network"
  return "unknown"
}
