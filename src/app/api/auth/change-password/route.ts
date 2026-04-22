import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type Body = {
  currentPassword?: unknown
  newPassword?: unknown
  confirmPassword?: unknown
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : ""

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Current password, new password, and confirmation are required" },
      { status: 400 },
    )
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match" }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 },
    )
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.password) {
    return NextResponse.json(
      { error: "Password change is not available for OAuth-only accounts" },
      { status: 400 },
    )
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  })

  return NextResponse.json({ success: true }, { status: 200 })
}
