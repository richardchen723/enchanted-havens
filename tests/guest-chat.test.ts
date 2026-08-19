import { describe, expect, it } from "vitest"
import {
  buildGuestChatFallbackSms,
  GUEST_CHAT_AUTOMATED_RESPONSE,
  hostawayMessageBodyToPlainText,
} from "@/lib/guest-chat-utils"
import { labelHostawayGuestMessage } from "@/lib/hostaway-message-source"
import { isValidHostawayWebhookAuthorization, parseHostawayChatWebhook } from "@/lib/hostaway-webhook"
import { selectNearestAvailableInquiryDates } from "@/lib/hostaway"

describe("guest chat", () => {
  it("labels Hostaway copies without changing or double-labeling the source text", () => {
    const labeled = labelHostawayGuestMessage("Is early check-in available?", "webchat")
    expect(labeled).toBe("Is early check-in available?\n\n(Source: Enchanted Havens website — webchat)")
    expect(labelHostawayGuestMessage(labeled, "webchat")).toBe(labeled)
    expect(labelHostawayGuestMessage("   ", "webchat")).toBe("")
  })

  it("builds a bounded branded fallback SMS with opt-out language", () => {
    expect(GUEST_CHAT_AUTOMATED_RESPONSE).toMatch(/before you see our reply/i)
    const short = buildGuestChatFallbackSms(["We have availability for those dates."])
    expect(short).toMatch(/^Enchanted Havens:/)
    expect(short).toMatch(/Reply STOP to opt out\.$/)
    const long = buildGuestChatFallbackSms(["x".repeat(2000)])
    expect(long).toHaveLength(1200)
    expect(long).toMatch(/…\n\nReply to this text/)
  })

  it("turns Hostaway HTML into readable transcript text", () => {
    expect(hostawayMessageBodyToPlainText("<p>Response here.</p><p>We&apos;ll help &amp; follow up.</p>"))
      .toBe("Response here.\nWe'll help & follow up.")
  })

  it("parses message webhook variants and validates Basic auth", () => {
    expect(parseHostawayChatWebhook({ event: "message.received", object: "conversationMessage", data: { reservationId: 1234, conversationId: 5678 } }))
      .toEqual({ supported: true, reservationId: 1234, conversationId: 5678, messageId: null })
    expect(parseHostawayChatWebhook({ event: "reservation.updated" })).toEqual({ supported: false, reservationId: null, conversationId: null, messageId: null })
    const authorization = `Basic ${Buffer.from("enchanted:secret").toString("base64")}`
    expect(isValidHostawayWebhookAuthorization(authorization, "enchanted", "secret")).toBe(true)
    expect(isValidHostawayWebhookAuthorization(authorization, "enchanted", "different")).toBe(false)
  })

  it("selects the nearest available Hostaway routing window", () => {
    expect(selectNearestAvailableInquiryDates({
      "2026-08-20": { date: "2026-08-20", isAvailable: 0 },
      "2026-08-21": { date: "2026-08-21", isAvailable: 1, minimumStay: 2 },
      "2026-08-22": { date: "2026-08-22", isAvailable: 1 },
      "2026-08-23": { date: "2026-08-23", isAvailable: 1 },
    }, "2026-08-20")).toEqual({ checkIn: "2026-08-21", checkOut: "2026-08-23" })
  })
})
