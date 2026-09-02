"use client"

import { usePathname } from "next/navigation"
import { Analytics } from "@vercel/analytics/next"
import { MicrosoftClarity } from "@/components/microsoft-clarity"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { TextInquiryProvider } from "@/components/text-inquiry/text-inquiry-provider"

export function SiteFrame({
  children,
  chatEnabled,
  textMessagingEnabled,
  analyticsEnabled,
  clarityProjectId,
}: {
  children: React.ReactNode
  chatEnabled: boolean
  textMessagingEnabled: boolean
  analyticsEnabled: boolean
  clarityProjectId?: string
}) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")

  if (isAdmin) {
    return (
      <>
        <a href="#admin-content" className="fixed left-4 top-4 z-[100] -translate-y-24 bg-white px-4 py-3 text-sm focus:translate-y-0">
          Skip to dashboard
        </a>
        <main id="admin-content" className="min-h-dvh">{children}</main>
      </>
    )
  }

  return (
    <TextInquiryProvider enabled={chatEnabled} smsFallbackEnabled={textMessagingEnabled}>
      <a href="#main-content" className="fixed left-4 top-4 z-[100] -translate-y-24 bg-white px-4 py-3 text-sm focus:translate-y-0">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="site-main">{children}</main>
      <SiteFooter />
      <MicrosoftClarity projectId={clarityProjectId} allowedHosts={["enchantedhavens.com", "www.enchantedhavens.com"]} siteLabel="enchanted_havens" />
      {analyticsEnabled ? <Analytics /> : null}
    </TextInquiryProvider>
  )
}
