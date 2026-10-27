import { agentOpenApi } from "@/lib/agent-openapi"
export function GET() {
  return Response.json(agentOpenApi(), { headers: { "Cache-Control": "public, max-age=3600", "Content-Type": "application/vnd.oai.openapi+json" } })
}
