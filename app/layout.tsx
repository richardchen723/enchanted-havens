import type { Metadata } from "next"
import { Cormorant_Garamond, Manrope } from "next/font/google"
import { SiteFrame } from "@/components/site-frame"
import { isDatabaseConfigured } from "@/lib/db"
import { isHostawayConfigured } from "@/lib/hostaway"
import { absoluteUrl } from "@/lib/utils"
import "./globals.css"

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  display: "swap",
})

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl()),
  title: {
    default: "Enchanted Havens | Private Pacific Northwest Retreats",
    template: "%s | Enchanted Havens",
  },
  description: "A curated collection of rare lakefront, oceanfront, and forest retreats across the Pacific Northwest.",
  openGraph: {
    type: "website",
    title: "Enchanted Havens",
    description: "The Pacific Northwest, privately yours.",
    siteName: "Enchanted Havens",
    url: "/",
    images: [{ url: "/images/home-hero/pnw-sea-renity-ocean-bluff.webp", alt: "Pacific Northwest oceanfront landscape for Enchanted Havens private retreats" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Enchanted Havens",
    description: "The Pacific Northwest, privately yours.",
    images: [{ url: "/images/home-hero/pnw-sea-renity-ocean-bluff.webp", alt: "Pacific Northwest oceanfront landscape for Enchanted Havens private retreats" }],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const analyticsEnabled = process.env.VERCEL === "1"
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim()
  const textMessagingEnabled = process.env.HOSTAWAY_SMS_ENABLED !== "false" && isHostawayConfigured() && isDatabaseConfigured()
  const chatEnabled = isDatabaseConfigured()

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable}`}>
      <head>
        {clarityProjectId ? <link rel="preconnect" href="https://www.clarity.ms" /> : null}
        {clarityProjectId ? <link rel="dns-prefetch" href="https://c.bing.com" /> : null}
      </head>
      <body>
        <SiteFrame chatEnabled={chatEnabled} textMessagingEnabled={textMessagingEnabled} analyticsEnabled={analyticsEnabled} clarityProjectId={clarityProjectId}>{children}</SiteFrame>
      </body>
    </html>
  )
}
