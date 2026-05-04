import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

let cachedClient: S3Client | null = null

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  }
}

function getClient(): { client: S3Client; bucket: string } | null {
  const cfg = getR2Config()
  if (!cfg) return null
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    })
  }
  return { client: cachedClient, bucket: cfg.bucket }
}

export function isR2Configured(): boolean {
  return getR2Config() !== null
}

export async function putObject(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string,
): Promise<void> {
  const ctx = getClient()
  if (!ctx) throw new Error('R2 is not configured')
  await ctx.client.send(
    new PutObjectCommand({
      Bucket: ctx.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

export interface GetObjectResult {
  body: ReadableStream<Uint8Array>
  contentType: string | null
  contentLength: number | null
}

export async function getObject(key: string): Promise<GetObjectResult | null> {
  const ctx = getClient()
  if (!ctx) throw new Error('R2 is not configured')
  try {
    const res = await ctx.client.send(
      new GetObjectCommand({ Bucket: ctx.bucket, Key: key }),
    )
    if (!res.Body) return null
    return {
      body: res.Body.transformToWebStream(),
      contentType: res.ContentType ?? null,
      contentLength: res.ContentLength ?? null,
    }
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'NoSuchKey' || name === 'NotFound') return null
    throw err
  }
}

export async function deleteObject(key: string): Promise<void> {
  const ctx = getClient()
  if (!ctx) throw new Error('R2 is not configured')
  await ctx.client.send(new DeleteObjectCommand({ Bucket: ctx.bucket, Key: key }))
}
