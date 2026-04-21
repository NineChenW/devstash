export function isEmailVerificationEnabled(): boolean {
  const raw = process.env.EMAIL_VERIFICATION_ENABLED
  if (typeof raw !== "string") return false
  const normalized = raw.trim().toLowerCase()
  return normalized === "true" || normalized === "1"
}
