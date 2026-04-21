import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

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

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token } })
    return { ok: false, reason: "expired" }
  }

  await prisma.verificationToken.deleteMany({ where: { token } })
  return { ok: true, email: record.identifier }
}
