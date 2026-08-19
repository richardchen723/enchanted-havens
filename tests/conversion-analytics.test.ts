import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }))

import { track } from "@vercel/analytics"
import { trackConversionEvent } from "@/lib/analytics"

afterEach(() => {
  vi.mocked(track).mockClear()
  vi.unstubAllGlobals()
})

describe("conversion analytics", () => {
  it("mirrors conversion events into an explicitly named Clarity event", () => {
    const clarity = vi.fn()
    vi.stubGlobal("window", { clarity })

    trackConversionEvent("Stay Search Started", { guests: 4 })

    expect(track).toHaveBeenCalledWith("Stay Search Started", { guests: 4 })
    expect(clarity).toHaveBeenCalledWith("event", "eh_stay_search_started")
  })

  it("keeps conversion actions safe when Clarity is unavailable", () => {
    vi.stubGlobal("window", {})

    expect(() => trackConversionEvent("Checkout Confirmed")).not.toThrow()
    expect(track).toHaveBeenCalledWith("Checkout Confirmed", {})
  })
})
