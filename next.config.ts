import type { NextConfig } from "next"

const isDevelopment = process.env.NODE_ENV === "development"
const siteUsesHttps = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost").protocol === "https:"
  } catch {
    return false
  }
})()
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://js.stripe.com https://va.vercel-scripts.com https://www.clarity.ms https://*.clarity.ms https://c.bing.com`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://bookingenginecdn.hostaway.com https://bookingenginecdn-2.hostaway.com https://hostaway-platform.s3.us-west-2.amazonaws.com https://a0.muscache.com https://*.clarity.ms https://c.bing.com",
  `connect-src 'self' https://api.stripe.com https://r.stripe.com https://m.stripe.network https://q.stripe.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.clarity.ms https://c.bing.com${isDevelopment ? " ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*" : ""}`,
  "frame-src https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  ...(!isDevelopment && siteUsesHttps ? ["upgrade-insecure-requests"] : []),
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
]

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    qualities: [60, 65, 75, 82, 90],
    remotePatterns: [
      { protocol: "https", hostname: "bookingenginecdn.hostaway.com" },
      { protocol: "https", hostname: "bookingenginecdn-2.hostaway.com" },
      { protocol: "https", hostname: "hostaway-platform.s3.us-west-2.amazonaws.com" },
      { protocol: "https", hostname: "a0.muscache.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
