import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const PWRESET_TTL_MS = 60 * 60 * 1000
const PWRESET_PREFIX = "pwreset:"

export async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + TOKEN_TTL_MS)

  await prisma.verificationToken.deleteMany({ where: { identifier: email } })
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  return token
}

export type ConsumeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "not-found" | "expired" }

export async function consumeVerificationToken(token: string): Promise<ConsumeResult> {
  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record) return { ok: false, reason: "not-found" }
  if (record.identifier.startsWith(PWRESET_PREFIX)) return { ok: false, reason: "not-found" }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token } })
    return { ok: false, reason: "expired" }
  }

  await prisma.verificationToken.deleteMany({ where: { token } })
  return { ok: true, email: record.identifier }
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + PWRESET_TTL_MS)
  const identifier = `${PWRESET_PREFIX}${email}`

  await prisma.verificationToken.deleteMany({ where: { identifier } })
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  })

  return token
}

export async function checkPasswordResetToken(token: string): Promise<ConsumeResult> {
  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record || !record.identifier.startsWith(PWRESET_PREFIX)) {
    return { ok: false, reason: "not-found" }
  }
  if (record.expires < new Date()) return { ok: false, reason: "expired" }
  return { ok: true, email: record.identifier.slice(PWRESET_PREFIX.length) }
}

export async function consumePasswordResetToken(token: string): Promise<ConsumeResult> {
  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record || !record.identifier.startsWith(PWRESET_PREFIX)) {
    return { ok: false, reason: "not-found" }
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token } })
    return { ok: false, reason: "expired" }
  }

  await prisma.verificationToken.deleteMany({ where: { token } })
  return { ok: true, email: record.identifier.slice(PWRESET_PREFIX.length) }
}
