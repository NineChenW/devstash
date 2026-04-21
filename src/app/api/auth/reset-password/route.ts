import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { consumePasswordResetToken } from "@/lib/verification-token"

type Body = {
  token?: unknown
  password?: unknown
  confirmPassword?: unknown
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const token = typeof body.token === "string" ? body.token : ""
  const password = typeof body.password === "string" ? body.password : ""
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : ""

  if (!token) {
    return NextResponse.json({ error: "Reset token is required", code: "missing" }, { status: 400 })
  }
  if (!password || !confirmPassword) {
    return NextResponse.json({ error: "Password and confirmation are required" }, { status: 400 })
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    )
  }

  const result = await consumePasswordResetToken(token)
  if (!result.ok) {
    const code = result.reason === "expired" ? "expired" : "invalid"
    const message =
      code === "expired"
        ? "That reset link has expired. Request a new one."
        : "That reset link is invalid or has already been used."
    return NextResponse.json({ error: message, code }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: result.email } })
  if (!user) {
    return NextResponse.json(
      { error: "That reset link is invalid or has already been used.", code: "invalid" },
      { status: 400 },
    )
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  })

  return NextResponse.json({ success: true }, { status: 200 })
}
