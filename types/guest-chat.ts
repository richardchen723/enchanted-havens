export type GuestChatThreadStatus = "waiting_on_team" | "waiting_on_guest" | "closed" | "spam"

export type GuestChatAuthorType = "guest" | "staff" | "system"
export type GuestChatSyncStatus = "not_applicable" | "mirrored" | "failed"
export type GuestChatIntent = "availability" | "haven_question" | "special_request" | "general"

export interface GuestChatContext {
  listingSlug: string | null
  havenName: string | null
  checkIn: string | null
  checkOut: string | null
  guests: number | null
  sourcePath: string | null
  sourceType: string | null
}

export interface GuestChatMessage {
  id: string
  threadId: string
  authorType: GuestChatAuthorType
  body: string
  hostawayMessageId: number | null
  hostawaySyncStatus: GuestChatSyncStatus
  hostawaySyncError: string | null
  createdAt: string
}

export interface GuestChatThreadSummary {
  id: string
  guestName: string
  guestEmail: string
  guestPhone: string
  status: GuestChatThreadStatus
  intent: GuestChatIntent
  hostawayReservationId: number | null
  lastMessagePreview: string | null
  lastMessageAt: string | null
  guestUnreadCount: number
  context: GuestChatContext
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface GuestChatThreadDetail extends GuestChatThreadSummary {
  messages: GuestChatMessage[]
  canConvertToInquiry: boolean
}

export interface CreateGuestChatThreadInput {
  guestName: string
  guestPhone: string
  message: string
  intent?: GuestChatIntent
  context?: Partial<GuestChatContext>
}

export interface AppendGuestChatMessageInput {
  message: string
  guestPhone?: string | null
  context?: Partial<GuestChatContext>
}
