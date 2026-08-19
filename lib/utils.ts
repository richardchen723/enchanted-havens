import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD", options: { cents?: boolean } = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: options.cents ? 2 : 0,
    maximumFractionDigits: options.cents ? 2 : 0,
  }).format(amount)
}

export function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T12:00:00Z`).getTime()
  const end = new Date(`${checkOut}T12:00:00Z`).getTime()
  return Math.max(0, Math.round((end - start) / 86_400_000))
}

export function quoteHasChanged(previous: { total: number }, current: { total: number }, tolerance = 0.01) {
  return Math.abs(previous.total - current.total) > tolerance
}

export function absoluteUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://enchantedhavens.com"
  return new URL(path, base).toString()
}
