export type HostawayWebsiteMessageSource = "webchat" | "text_message_form"

const HOSTAWAY_SOURCE_LABELS: Record<HostawayWebsiteMessageSource, string> = {
  webchat: "(Source: Enchanted Havens website — webchat)",
  text_message_form: "(Source: Enchanted Havens website — text-message form)",
}

/** Add source context only to the Hostaway copy; the guest transcript stays unchanged. */
export function labelHostawayGuestMessage(body: string, source: HostawayWebsiteMessageSource) {
  const message = body.trim()
  if (!message) return ""
  const label = HOSTAWAY_SOURCE_LABELS[source]
  return message.endsWith(label) ? message : `${message}\n\n${label}`
}
