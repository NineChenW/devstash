import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createPasswordResetToken } from "@/lib/verification-token"
import { sendPasswordResetEmail } from "@/lib/email"
import {
  checkRateLimit,
  getRequestIp,
  rateLimitResponse,
} from "@/lib/rate-limit"

type Body = { email?: unknown }

export async function POST(req: Request) {
  const rl = await checkRateLimit("forgot-password", getRequestIp(req))
  if (!rl.success) return rateLimitResponse(rl)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (user?.password) {
    try {
      const token = await createPasswordResetToken(email)
      await sendPasswordResetEmail(email, token)
    } catch (err) {
      console.error("password reset email failed", err)
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
