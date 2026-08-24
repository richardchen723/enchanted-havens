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
    expect(clarity).toHaveBeenCalledWith("set", "eh_guests", "4")
    expect(clarity).toHaveBeenCalledWith("set", "eh_funnel_stage", "search_started")
    expect(clarity).toHaveBeenCalledWith("event", "eh_stay_search_started")
  })

  it("adds bounded, privacy-safe Clarity dimensions without forwarding dates or internal IDs", () => {
    const clarity = vi.fn()
    vi.stubGlobal("window", { clarity })

    trackConversionEvent("Checkout Started", {
      property: "blue-haven",
      variant: "entire-home",
      guests: 6,
      checkIn: "2026-10-30",
      threadId: "private-thread-id",
    })

    expect(clarity).toHaveBeenCalledWith("set", "eh_property", "blue-haven")
    expect(clarity).toHaveBeenCalledWith("set", "eh_variant", "entire-home")
    expect(clarity).toHaveBeenCalledWith("set", "eh_guests", "6")
    expect(clarity).toHaveBeenCalledWith("set", "eh_funnel_stage", "checkout_started")
    expect(clarity).not.toHaveBeenCalledWith("set", "eh_checkin", expect.anything())
    expect(clarity).not.toHaveBeenCalledWith("set", "eh_threadid", expect.anything())
    expect(clarity).toHaveBeenLastCalledWith("event", "eh_checkout_started")
  })

  it("keeps conversion actions safe when Clarity is unavailable", () => {
    vi.stubGlobal("window", {})

    expect(() => trackConversionEvent("Checkout Confirmed")).not.toThrow()
    expect(track).toHaveBeenCalledWith("Checkout Confirmed", {})
  })
})
