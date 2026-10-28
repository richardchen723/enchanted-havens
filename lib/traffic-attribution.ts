// Bounded attribution only: never store or forward full referrers, queries,
// contact information, or booking identifiers. Missing evidence stays unknown.
export const aiSources = ["chatgpt", "gemini", "claude", "muse", "meta-ai", "perplexity", "unknown"] as const
export type AiSource = typeof aiSources[number]
export type TrafficContext = { aiSource: AiSource; attributionEvidence: "utm" | "referrer" | "none"; trafficType: "visitor" | "qa" }
const storageKey = "eh-traffic-v1"
const aliases: Record<string, AiSource> = {
  chatgpt: "chatgpt", "chatgpt.com": "chatgpt", "chat.openai.com": "chatgpt",
  gemini: "gemini", "gemini.google.com": "gemini",
  claude: "claude", "claude.ai": "claude",
  muse: "muse", "muse.ai": "muse",
  "meta-ai": "meta-ai", "meta.ai": "meta-ai",
  perplexity: "perplexity", "perplexity.ai": "perplexity",
}

export function classifyTraffic(url: string, referrer = ""): TrafficContext {
  const unknown: TrafficContext = { aiSource: "unknown", attributionEvidence: "none", trafficType: "visitor" }
  try {
    const page = new URL(url)
    const source = page.searchParams.get("utm_source")?.trim().toLowerCase() || ""
    const medium = page.searchParams.get("utm_medium")?.trim().toLowerCase()
    const qa = (source === "internal" && medium === "qa") || /^(qa|release840|ticket840|baseline840)$/.test(source)
    const trafficType = qa ? "qa" : "visitor"
    if (Object.hasOwn(aliases, source)) return { aiSource: aliases[source], attributionEvidence: "utm", trafficType }
    let host = ""
    try { host = referrer ? new URL(referrer).hostname.toLowerCase().replace(/^www\./, "") : "" } catch { /* Keep explicit QA marking even with an invalid referrer. */ }
    if (host.includes(".") && Object.hasOwn(aliases, host)) return { aiSource: aliases[host], attributionEvidence: "referrer", trafficType }
    return { ...unknown, trafficType }
  } catch {
    return unknown
  }
}

export function browserTrafficContext(): TrafficContext | null {
  if (typeof window === "undefined" || !window.location?.href) return null
  const current = classifyTraffic(window.location.href, typeof document === "undefined" ? "" : document.referrer)
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(storageKey) || "null") as TrafficContext | null
    const valid = saved && aiSources.includes(saved.aiSource) && ["utm", "referrer", "none"].includes(saved.attributionEvidence) && ["visitor", "qa"].includes(saved.trafficType)
    // Keep the first landing attribution within this tab. QA marking is sticky,
    // including when a test starts midway through an existing visitor tab.
    const context = valid ? { ...saved, trafficType: current.trafficType === "qa" ? "qa" as const : saved.trafficType } : current
    window.sessionStorage.setItem(storageKey, JSON.stringify(context))
    return context
  } catch {
    // Blocked storage must never interrupt search, inquiry, or checkout.
    return current
  }
}
