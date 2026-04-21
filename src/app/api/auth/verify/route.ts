import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { consumeVerificationToken } from "@/lib/verification-token"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get("token")
  const base = `${url.protocol}//${url.host}`

  if (!token) {
    return NextResponse.redirect(`${base}/sign-in?verify=missing`)
  }

  const result = await consumeVerificationToken(token)
  if (!result.ok) {
    const reason = result.reason === "expired" ? "expired" : "invalid"
    return NextResponse.redirect(`${base}/sign-in?verify=${reason}`)
  }

  const user = await prisma.user.findUnique({ where: { email: result.email } })
  if (!user) {
    return NextResponse.redirect(`${base}/sign-in?verify=invalid`)
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })
  }

  return NextResponse.redirect(`${base}/sign-in?verified=1`)
}
