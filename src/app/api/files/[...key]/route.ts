import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getDemoUserId } from '@/lib/db/collections'
import { getObject, isR2Configured } from '@/lib/r2'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Not authenticated', { status: 401 })
  }

  if (!isR2Configured()) {
    return new Response('File storage is not configured', { status: 503 })
  }

  const { key: segments } = await params
  const key = segments.map((s) => decodeURIComponent(s)).join('/')
  if (!key) return new Response('Not found', { status: 404 })

  const ownerId = (await getDemoUserId()) ?? session.user.id

  const item = await prisma.item.findFirst({
    where: { userId: ownerId, fileUrl: `/api/files/${key}` },
    select: { id: true, fileName: true },
  })
  if (!item) return new Response('Not found', { status: 404 })

  const obj = await getObject(key)
  if (!obj) return new Response('Not found', { status: 404 })

  const headers = new Headers()
  headers.set('Content-Type', obj.contentType ?? 'application/octet-stream')
  if (obj.contentLength != null) {
    headers.set('Content-Length', String(obj.contentLength))
  }
  if (new URL(req.url).searchParams.get('download') === '1') {
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(item.fileName ?? 'download')}"`,
    )
  } else {
    headers.set('Content-Disposition', 'inline')
  }
  headers.set('Cache-Control', 'private, max-age=300')

  return new Response(obj.body, { status: 200, headers })
}
