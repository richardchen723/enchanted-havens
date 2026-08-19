function nationalDigits(value: string) {
  const digits = value.replace(/\D/g, "")
  const hasExplicitUsCode = /^\s*\+1/.test(value) || (digits.length === 11 && digits.startsWith("1"))
  return hasExplicitUsCode ? digits.slice(1) : digits
}

export function formatUsPhoneInput(value: string) {
  const digits = nationalDigits(value).slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)})${digits.slice(3)}`
  return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function isValidUsPhone(value: string) {
  return /^\d{10}$/.test(nationalDigits(value))
}

export function toE164UsPhone(value: string) {
  const digits = nationalDigits(value)
  if (!/^\d{10}$/.test(digits)) throw new Error("Enter a valid 10-digit US phone number.")
  return `+1${digits}`
}
