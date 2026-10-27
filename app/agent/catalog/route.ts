import { agentCatalog } from "@/lib/public-stays"
import { stayErrorResponse } from "@/lib/public-stay-request"
export async function GET() {
  try { return Response.json(await agentCatalog(), { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600", "Link": '</agent/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"' } }) }
  catch (error) { return stayErrorResponse(error) }
}
