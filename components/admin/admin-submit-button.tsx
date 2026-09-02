"use client"

import { LoaderCircle } from "lucide-react"
import { useFormStatus } from "react-dom"

export function AdminSubmitButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
      {pending ? "Please wait…" : children}
    </button>
  )
}
