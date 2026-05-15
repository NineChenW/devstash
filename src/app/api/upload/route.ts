import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDemoUserId } from '@/lib/db/collections'
import { isR2Configured, putObject } from '@/lib/r2'
import {
  sanitizeFileName,
  validateUpload,
  type UploadKind,
} from '@/lib/file-constraints'
import { gateForUploadKind, isProForGating } from '@/lib/usage-limits'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'File uploads are not configured on this server' },
      { status: 503 },
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const kindRaw = form.get('kind')
  const file = form.get('file')

  const kind = kindRaw === 'image' ? 'image' : kindRaw === 'file' ? 'file' : null
  if (!kind) {
    return NextResponse.json({ error: 'kind must be "file" or "image"' }, { status: 400 })
  }

  const gate = gateForUploadKind({ isPro: isProForGating(session), kind })
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 403 })
  }

  if (!(file instanceof Blob) || typeof (file as File).name !== 'string') {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const fileName = (file as File).name
  const size = file.size
  const mime = file.type

  const validation = validateUpload(kind as UploadKind, fileName, size, mime)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const ownerId = (await getDemoUserId()) ?? session.user.id
  const id = randomKey()
  const safeName = sanitizeFileName(fileName)
  const key = `users/${ownerId}/${kind}/${id}-${safeName}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType = mime || 'application/octet-stream'

  try {
    await putObject(key, buffer, contentType)
  } catch (err) {
    console.error('R2 upload failed', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  return NextResponse.json(
    {
      key,
      fileName,
      fileSize: size,
      contentType,
      url: `/api/files/${key}`,
    },
    { status: 201 },
  )
}

function randomKey(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
