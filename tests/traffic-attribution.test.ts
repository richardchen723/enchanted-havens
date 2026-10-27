import { afterEach, describe, expect, it, vi } from "vitest"
import { browserTrafficContext, classifyTraffic } from "@/lib/traffic-attribution"

afterEach(() => vi.unstubAllGlobals())

describe("bounded AI referral attribution", () => {
  it("distinguishes provider evidence and rejects lookalike domains", () => {
    expect(classifyTraffic("https://www.enchantedhavens.com/?utm_source=chatgpt.com", "https://claude.ai/chat/secret")).toEqual({ aiSource: "chatgpt", attributionEvidence: "utm", trafficType: "visitor" })
    expect(classifyTraffic("https://www.enchantedhavens.com", "https://www.perplexity.ai/search/private").aiSource).toBe("perplexity")
    expect(classifyTraffic("https://www.enchantedhavens.com", "https://chatgpt.com.evil.example").aiSource).toBe("unknown")
    expect(classifyTraffic("https://www.enchantedhavens.com", "https://meta.ai").aiSource).toBe("meta-ai")
    expect(classifyTraffic("https://www.enchantedhavens.com", "https://muse.ai").aiSource).toBe("muse")
    expect(classifyTraffic("https://www.enchantedhavens.com").attributionEvidence).toBe("none")
    expect(classifyTraffic("https://www.enchantedhavens.com/?utm_source=constructor").aiSource).toBe("unknown")
    expect(classifyTraffic("https://www.enchantedhavens.com/?utm_source=__proto__").aiSource).toBe("unknown")
    expect(classifyTraffic("https://www.enchantedhavens.com", "https://claude").aiSource).toBe("unknown")
    expect(classifyTraffic("https://www.enchantedhavens.com/?utm_source=internal&utm_medium=qa", "invalid-referrer").trafficType).toBe("qa")
  })

  it("keeps first-touch context through navigation and makes explicit QA marking sticky", () => {
    const data = new Map<string, string>()
    const windowMock = { location: { href: "https://www.enchantedhavens.com/?utm_source=claude" }, sessionStorage: { getItem: (k: string) => data.get(k) || null, setItem: (k: string, v: string) => data.set(k, v) } }
    vi.stubGlobal("window", windowMock)
    expect(browserTrafficContext()?.aiSource).toBe("claude")
    windowMock.location.href = "https://www.enchantedhavens.com/checkout"
    expect(browserTrafficContext()?.aiSource).toBe("claude")
    windowMock.location.href += "?utm_source=internal&utm_medium=qa"
    expect(browserTrafficContext()?.trafficType).toBe("qa")
    windowMock.location.href = "https://www.enchantedhavens.com/checkout"
    expect(browserTrafficContext()?.trafficType).toBe("qa")
    expect([...data.values()].join()).not.toContain("https:")
  })

  it("survives blocked storage and treats direct traffic as unknown", () => {
    vi.stubGlobal("window", { location: { href: "https://www.enchantedhavens.com" }, get sessionStorage() { throw new Error("blocked") } })
    expect(browserTrafficContext()).toEqual({ aiSource: "unknown", attributionEvidence: "none", trafficType: "visitor" })
  })
})
