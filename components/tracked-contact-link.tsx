"use client"

import Link from "next/link"
import type { MouseEventHandler, ReactNode } from "react"
import { trackConversionEvent } from "@/lib/analytics"

export function TrackedContactLink({ href, eventName, location, className, children, target, rel, ariaLabel, onClick }: { href: string; eventName: "Phone Contact Clicked" | "Email Contact Clicked" | "Airbnb Reviews Clicked"; location: string; className?: string; children: ReactNode; target?: string; rel?: string; ariaLabel?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  const trackClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    trackConversionEvent(eventName, { location })
    onClick?.(event)
  }
  return <a href={href} target={target} rel={rel} aria-label={ariaLabel} className={className} onClick={trackClick}>{children}</a>
}

export function TrackedEventLink({ href, eventName, data, className, children, target, rel, ariaLabel }: { href: string; eventName: string; data?: Record<string, string | number | boolean>; className?: string; children: ReactNode; target?: string; rel?: string; ariaLabel?: string }) {
  return <a href={href} target={target} rel={rel} aria-label={ariaLabel} className={className} onClick={() => trackConversionEvent(eventName, data)}>{children}</a>
}

export function TrackedInternalLink({ href, eventName, data, className, children, ariaLabel }: { href: string; eventName: string; data?: Record<string, string | number | boolean>; className?: string; children: ReactNode; ariaLabel?: string }) {
  return <Link href={href} aria-label={ariaLabel} className={className} onClick={() => trackConversionEvent(eventName, data)}>{children}</Link>
}
