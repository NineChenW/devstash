import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await prisma.user.delete({ where: { id: session.user.id } })
  } catch (err) {
    console.error("account delete failed", err)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
