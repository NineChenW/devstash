import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createVerificationToken } from "@/lib/verification-token"
import { sendVerificationEmail } from "@/lib/email"
import { isEmailVerificationEnabled } from "@/lib/features"

type Body = { email?: unknown }

export async function POST(req: Request) {
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

  if (!isEmailVerificationEnabled()) {
    return NextResponse.json({ success: true }, { status: 200 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (user && !user.emailVerified) {
    try {
      const token = await createVerificationToken(email)
      await sendVerificationEmail(email, token)
    } catch (err) {
      console.error("resend verification email failed", err)
    }
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
