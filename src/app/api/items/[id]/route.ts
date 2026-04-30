import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDemoUserId } from '@/lib/db/collections'
import { getItemDetail } from '@/lib/db/items'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id } = await params

  // Match the dashboard / items-list page behavior: cards currently come from
  // the demo user via getDemoUserId(), so detail lookups must too. Once those
  // pages switch to session.user.id, scope this lookup the same way.
  const ownerId = (await getDemoUserId()) ?? session.user.id
  const item = await getItemDetail(id, ownerId)
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ item }, { status: 200 })
}
