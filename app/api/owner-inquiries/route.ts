import { randomUUID } from "node:crypto"
import { ZodError } from "zod"
import { BRAND_CONTACT_EMAIL, BRAND_CONTACT_PHONE, BRAND_CONTACT_PHONE_DISPLAY } from "@/lib/brand"
import { deliverOwnerInquiry, OwnerInquiryError } from "@/lib/owner-inquiries"
import { ownerInquirySchema } from "@/lib/owner-inquiry-schema"
import { OWNER_PROPERTY_FEATURES } from "@/lib/owner-property-features"
import { OWNER_PAGE_PATH } from "@/lib/owner-management"

export const runtime = "nodejs"
export const maxDuration = 60

const attempts = new Map<string, number[]>()
const windowMs = 15 * 60 * 1000
const maxBodyBytes = 16000
const responseHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }

function rateLimited(request: Request) {
  const now = Date.now()
  for (const [key, times] of attempts) if (times.every((time) => now - time >= windowMs)) attempts.delete(key)
  // Vercel supplies this header at its trusted edge. Prefer it over a forwarded
  // chain supplied by another proxy. This remains supplementary per-process protection.
  const key = (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for"))?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown"
  const times = (attempts.get(key) || []).filter((time) => now - time < windowMs)
  if (times.length >= 5 || (!attempts.has(key) && attempts.size >= 10000)) return true
  attempts.set(key, [...times, now])
  return false
}

async function readBody(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > maxBodyBytes) throw new RangeError()
  if (!request.body) return ""
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > maxBodyBytes) {
        await reader.cancel()
        throw new RangeError()
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks).toString("utf8")
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!)
}

// A real form POST also works without JavaScript. Errors preserve entered values.
function formError(message: string, status: number, values: Record<string, unknown>) {
  const input = (name: string, label: string, type = "text", required = false, attributes = "") => `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(values[name])}" ${required ? "required" : ""} ${attributes}></label>`
  const selectedFeatures = Array.isArray(values.features) ? values.features : []
  const features = `<fieldset><legend>Property features (optional)</legend>${OWNER_PROPERTY_FEATURES.map((feature) => `<label><input type="checkbox" name="features" value="${escapeHtml(feature)}" ${selectedFeatures.includes(feature) ? "checked" : ""}> ${escapeHtml(feature)}</label>`).join("")}</fieldset>`
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Owner inquiry | Enchanted Havens</title><style>body{margin:0;background:#faf7f0;color:#173c33;font:16px/1.7 system-ui,sans-serif}main{max-width:640px;margin:50px auto;padding:24px}h1{font:44px/1.1 Georgia,serif}label{display:block;margin:18px 0}input,textarea{display:block;box-sizing:border-box;width:100%;padding:12px;font:inherit;border:1px solid #c9c0b0;background:white;color:#18221f}input[type=checkbox]{display:inline-block;width:auto;margin-right:8px}fieldset{border:1px solid #c9c0b0;margin-top:20px}button{padding:15px 24px;background:#173c33;color:#f3eee3;border:0;font:inherit}a{color:inherit}p[role=alert]{border-left:3px solid #805a27;padding-left:16px}</style></head><body><main><a href="${OWNER_PAGE_PATH}">Enchanted Havens · For Owners</a><h1>Let's talk about your home.</h1><p role="alert">${escapeHtml(message)}</p><form method="post" action="/api/owner-inquiries"><div hidden aria-hidden="true"><label>Leave this field blank<input name="website" tabindex="-1" autocomplete="off"></label></div><input type="hidden" name="submissionKey" value="${escapeHtml(values.submissionKey)}">${input("name", "Name", "text", true)}${input("email", "Email", "email", true)}${input("propertyAddress", "Property address (street, city, state, ZIP)", "text", true, 'minlength="8" maxlength="300" autocomplete="street-address"')}${input("bedrooms", "Bedrooms (0 for a studio)", "number", true, 'min="0" max="50" step="1" inputmode="numeric"')}${input("bathrooms", "Bathrooms (include half baths, e.g. 2.5)", "number", true, 'min="0.5" max="50" step="0.5" inputmode="decimal"')}${features}${input("phone", "Phone (optional)", "tel")}<label>Anything you would like us to know? (optional)<textarea name="message" rows="5">${escapeHtml(values.message)}</textarea></label><button type="submit">Send my inquiry</button></form><p>Or <a href="tel:${BRAND_CONTACT_PHONE}">call ${BRAND_CONTACT_PHONE_DISPLAY}</a> or <a href="mailto:${BRAND_CONTACT_EMAIL}">email our team</a>.</p><p><a href="/privacy">Privacy policy</a></p></main></body></html>`, { status, headers: { ...responseHeaders, "Content-Type": "text/html; charset=utf-8" } })
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || ""
  const isForm = contentType.includes("application/x-www-form-urlencoded")
  let values: Record<string, unknown> = {}
  const errorResponse = (message: string, status: number) => isForm
    ? formError(message, status, values)
    : Response.json({ error: message }, { status, headers: responseHeaders })

  try {
    const origin = request.headers.get("origin")
    if (origin && origin !== new URL(request.url).origin) return errorResponse("Please submit your inquiry from our website.", 403)
    if (!isForm && !contentType.includes("application/json")) return errorResponse("Please submit the owner inquiry form.", 415)
    // Count invalid and blocked attempts too, before reading or validating input.
    const tooManyAttempts = rateLimited(request)
    const body = await readBody(request)
    if (isForm) {
      const fields = new URLSearchParams(body)
      values = { ...Object.fromEntries(fields), features: fields.getAll("features") }
    } else {
      values = JSON.parse(body)
    }
    // Preserve a native form's entered details even when the visitor must wait.
    if (tooManyAttempts) return errorResponse("Too many attempts from this connection. Please wait a few minutes, or call or email our team.", 429)
    const input = ownerInquirySchema.parse(values)
    input.submissionKey ||= randomUUID()
    values = input
    const result = await deliverOwnerInquiry(input)
    if (isForm) return new Response(null, { status: 303, headers: { ...responseHeaders, Location: `${OWNER_PAGE_PATH}/thank-you` } })
    return Response.json(result, { headers: responseHeaders })
  } catch (error) {
    if (error instanceof RangeError) return errorResponse("Please shorten your inquiry and try again.", 413)
    if (error instanceof ZodError) {
      const detailIssue = error.issues.find((issue) => issue.code === "custom" && ["propertyAddress", "message"].includes(String(issue.path[0])))
      return errorResponse(detailIssue?.message || "Please check your name, email, full property address, and room counts. Bedrooms must be whole numbers (0 for a studio); bathrooms can include half baths (e.g. 2.5). Keep your note under 4,000 characters.", 400)
    }
    if (error instanceof SyntaxError) return errorResponse("Please check your inquiry details and try again.", 400)
    if (error instanceof OwnerInquiryError) return errorResponse(error.message, error.status)
    // Do not put owner contact details or SMTP credentials in application logs.
    console.error("Owner inquiry delivery failed")
    return errorResponse("Your inquiry could not be delivered. Please try again, or call or email our team.", 503)
  }
}
