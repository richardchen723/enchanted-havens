import { track } from "@vercel/analytics"

declare global {
  interface Window {
    clarity?: (command: "event", value: string) => void
  }
}

function clarityEventName(name: string) {
  return `eh_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`
}

export function trackConversionEvent(name: string, data: Record<string, string | number | boolean> = {}) {
  try {
    track(name, data)
  } catch {
    // Conversion behavior must remain available when analytics is blocked.
  }

  try {
    if (typeof window !== "undefined") window.clarity?.("event", clarityEventName(name))
  } catch {
    // Clarity is optional and must never interrupt a conversion action.
  }
}
