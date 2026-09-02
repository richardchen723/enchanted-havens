"use client"

import { useState } from "react"
import { UserMinus, X } from "lucide-react"
import { removeAdminAction } from "@/app/admin/actions"
import { AdminSubmitButton } from "@/components/admin/admin-submit-button"

export function RemoveAdminControl({ userId, fullName }: { userId: string; fullName: string }) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming) {
    return <button type="button" onClick={() => setConfirming(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-900/12 px-3 text-xs font-semibold text-red-900 transition hover:bg-red-50"><UserMinus className="size-3.5" />Remove access</button>
  }
  return (
    <form action={removeAdminAction} className="flex flex-wrap items-center gap-2" aria-label={`Confirm removal of ${fullName}`}>
      <input type="hidden" name="userId" value={userId} />
      <AdminSubmitButton className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-900 px-3 text-xs font-semibold text-white disabled:opacity-60">Confirm remove</AdminSubmitButton>
      <button type="button" onClick={() => setConfirming(false)} className="grid size-10 place-items-center rounded-lg border border-black/10 bg-white" aria-label="Cancel removal"><X className="size-3.5" /></button>
    </form>
  )
}
