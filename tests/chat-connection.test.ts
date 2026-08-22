import { describe, expect, it, vi } from "vitest"
import {
  classifyGuestChatConnectionError,
  GuestChatRequestError,
  isRetryableGuestChatError,
  retryGuestChatRequest,
} from "@/lib/chat-connection"

describe("guest chat connection resilience", () => {
  it("retries transient failures and returns the recovered result", async () => {
    const task = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new GuestChatRequestError("Service unavailable", 503))
      .mockResolvedValueOnce("connected")
    const failures: Array<{ attempt: number; willRetry: boolean }> = []

    const result = await retryGuestChatRequest(task, {
      retryDelaysMs: [10, 20, 30],
      sleep: vi.fn().mockResolvedValue(undefined),
      onFailure: ({ attempt, willRetry }) => failures.push({ attempt, willRetry }),
    })

    expect(result).toEqual({ value: "connected", attempts: 3 })
    expect(task).toHaveBeenCalledTimes(3)
    expect(failures).toEqual([
      { attempt: 1, willRetry: true },
      { attempt: 2, willRetry: true },
    ])
  })

  it("stops immediately for a non-retryable response", async () => {
    const task = vi.fn().mockRejectedValue(new GuestChatRequestError("Invalid request", 400))
    const onFailure = vi.fn()

    await expect(retryGuestChatRequest(task, {
      retryDelaysMs: [10, 20],
      sleep: vi.fn().mockResolvedValue(undefined),
      onFailure,
    })).rejects.toThrow("Invalid request")

    expect(task).toHaveBeenCalledTimes(1)
    expect(onFailure).toHaveBeenCalledWith(expect.objectContaining({ attempt: 1, maxAttempts: 3, willRetry: false }))
  })

  it("classifies useful, non-sensitive diagnostic reasons", () => {
    expect(classifyGuestChatConnectionError(new TypeError("Failed to fetch"), false)).toBe("offline")
    expect(classifyGuestChatConnectionError(new DOMException("Timed out", "AbortError"))).toBe("timeout")
    expect(classifyGuestChatConnectionError(new TypeError("Failed to fetch"))).toBe("network")
    expect(classifyGuestChatConnectionError(new GuestChatRequestError("Unavailable", 503))).toBe("server")
    expect(classifyGuestChatConnectionError(new GuestChatRequestError("Slow down", 429))).toBe("rate_limited")
    expect(classifyGuestChatConnectionError(new GuestChatRequestError("Invalid", 400))).toBe("request")
  })

  it("retries only transient HTTP failures", () => {
    expect(isRetryableGuestChatError(new GuestChatRequestError("Timeout", 408))).toBe(true)
    expect(isRetryableGuestChatError(new GuestChatRequestError("Unavailable", 503))).toBe(true)
    expect(isRetryableGuestChatError(new GuestChatRequestError("Forbidden", 403))).toBe(false)
  })
})
