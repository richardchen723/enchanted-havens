import { createHash } from "node:crypto"

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase()
}

export function hashAdminToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
