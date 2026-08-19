export const GUEST_CHAT_PLACEHOLDER_EMAIL_DOMAIN = "guest-chat.enchantedhavens.com"
export const GUEST_CHAT_SENDER_LABEL = "Enchanted Havens"

export const GUEST_CHAT_AUTOMATED_RESPONSE =
  "Welcome to Enchanted Havens! One of our team members will be with you shortly. We'll send a brief Enchanted Havens confirmation to the phone number you provided. If you leave or the chat disconnects before you see our reply, we'll text that too so you don't miss it. You can continue the same conversation here or by text."

export const GUEST_CHAT_WEBCHAT_ONLY_AUTOMATED_RESPONSE =
  "Welcome to Enchanted Havens! One of our team members will be with you shortly. You can keep browsing and return to this chat whenever you're ready—we look forward to helping you."

const FALLBACK_SMS_PREFIX = "Enchanted Havens: "
const FALLBACK_SMS_SUFFIX =
  "\n\nReply to this text to continue. Message and data rates may apply. Reply STOP to opt out."
const FALLBACK_SMS_MAX_LENGTH = 1200

export function buildGuestChatFallbackSms(messages: string[]) {
  const content = messages.map((message) => message.trim()).filter(Boolean).join("\n\n")
  const availableLength = FALLBACK_SMS_MAX_LENGTH - FALLBACK_SMS_PREFIX.length - FALLBACK_SMS_SUFFIX.length
  const trimmedContent = content.length > availableLength
    ? `${content.slice(0, Math.max(0, availableLength - 1)).trimEnd()}…`
    : content
  return `${FALLBACK_SMS_PREFIX}${trimmedContent}${FALLBACK_SMS_SUFFIX}`
}

export function buildGuestChatPlaceholderEmail(phone: string) {
  const digits = phone.replace(/\D/g, "") || "guest"
  return `chat+${digits}@${GUEST_CHAT_PLACEHOLDER_EMAIL_DOMAIN}`
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"', ndash: "–", mdash: "—",
  }
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
    if (code.startsWith("#")) return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
    return namedEntities[code.toLowerCase()] ?? entity
  })
}

export function hostawayMessageBodyToPlainText(body: string) {
  const withLineBreaks = body
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<\/(p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")

  return decodeHtmlEntities(withLineBreaks)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}
