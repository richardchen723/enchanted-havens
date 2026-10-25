import type { Metadata } from "next"
import Link from "next/link"
import { BRAND_CONTACT_EMAIL, BRAND_CONTACT_PHONE, BRAND_CONTACT_PHONE_DISPLAY } from "@/lib/brand"

export const metadata: Metadata = { title: "Owner inquiry received", robots: { index: false, follow: true } }

export default function OwnerThankYouPage() {
  return <section className="container-shell py-24"><div className="mx-auto max-w-2xl"><p className="eyebrow text-[#805a27]">Enchanted Havens · For Owners</p><h1 className="mt-6 font-display text-5xl leading-tight text-[#173c33]">Thank you for introducing your home.</h1><p className="mt-6 leading-8 text-black/70">Our team has received your inquiry and will follow up to discuss your property and goals.</p><p className="mt-5 leading-8">You can also <a href={`tel:${BRAND_CONTACT_PHONE}`} className="underline">call {BRAND_CONTACT_PHONE_DISPLAY}</a> or <a href={`mailto:${BRAND_CONTACT_EMAIL}`} className="underline">email our team</a>.</p><Link href="/vacation-rental-management" className="button-primary mt-8">Back to owner management</Link></div></section>
}
