"use client"

import { useEffect, useState } from "react"
import { BRAND_CONTACT_PHONE } from "@/lib/brand"
import { TrackedEventLink } from "@/components/tracked-contact-link"

export function OwnerMobileContact() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const hero = document.getElementById("owner-hero")
    const form = document.getElementById("owner-inquiry")
    if (!hero || !form) return
    let heroVisible = true
    let formVisible = false
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.target === hero) heroVisible = entry.isIntersecting; if (entry.target === form) formVisible = entry.isIntersecting })
      setVisible(!heroVisible && !formVisible && form.getBoundingClientRect().bottom > 0)
    })
    observer.observe(hero)
    observer.observe(form)
    return () => observer.disconnect()
  }, [])
  if (!visible) return null
  return <aside aria-label="Contact the owner management team" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#c9c0b0] bg-[#faf7f0] px-4 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-5px_20px_rgba(7,30,25,.08)] lg:hidden"><div className="flex items-center gap-3"><TrackedEventLink href="#owner-inquiry" eventName="Owner Inquiry Clicked" data={{ placement: "mobile-sticky" }} className="button-primary flex-1">Tell us about your home</TrackedEventLink><TrackedEventLink href={`tel:${BRAND_CONTACT_PHONE}`} eventName="Owner Phone Clicked" data={{ placement: "mobile-sticky" }} className="inline-flex min-h-11 items-center px-2 text-sm underline underline-offset-4">Call</TrackedEventLink></div></aside>
}
