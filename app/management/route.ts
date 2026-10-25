import { permanentRedirect } from "next/navigation"
import { OWNER_PAGE_PATH } from "@/lib/owner-management"

export function GET(request: Request) {
  permanentRedirect(`${OWNER_PAGE_PATH}${new URL(request.url).search}`)
}
