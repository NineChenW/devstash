import { prisma } from "@/lib/prisma"

export const FREE_ITEM_LIMIT = 50
export const FREE_COLLECTION_LIMIT = 3
export const PRO_ITEM_TYPES = new Set(["file", "image"] as const)

export interface QuotaCheck {
  ok: boolean
  used: number
  limit: number
  error?: string
}

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "QuotaExceededError"
  }
}

export async function checkItemQuota(args: {
  userId: string
  isPro: boolean
  typeName: string
}): Promise<QuotaCheck> {
  if (args.isPro) {
    return { ok: true, used: 0, limit: Infinity }
  }

  if (PRO_ITEM_TYPES.has(args.typeName as "file" | "image")) {
    return {
      ok: false,
      used: 0,
      limit: 0,
      error: `${args.typeName} items are a Pro feature.`,
    }
  }

  const used = await prisma.item.count({ where: { userId: args.userId } })
  if (used >= FREE_ITEM_LIMIT) {
    return {
      ok: false,
      used,
      limit: FREE_ITEM_LIMIT,
      error: `You've reached the free plan's ${FREE_ITEM_LIMIT}-item limit. Upgrade to Pro for unlimited items.`,
    }
  }

  return { ok: true, used, limit: FREE_ITEM_LIMIT }
}

export async function checkCollectionQuota(args: {
  userId: string
  isPro: boolean
}): Promise<QuotaCheck> {
  if (args.isPro) {
    return { ok: true, used: 0, limit: Infinity }
  }

  const used = await prisma.collection.count({ where: { userId: args.userId } })
  if (used >= FREE_COLLECTION_LIMIT) {
    return {
      ok: false,
      used,
      limit: FREE_COLLECTION_LIMIT,
      error: `You've reached the free plan's ${FREE_COLLECTION_LIMIT}-collection limit. Upgrade to Pro for unlimited collections.`,
    }
  }

  return { ok: true, used, limit: FREE_COLLECTION_LIMIT }
}

export function gateForUploadKind(args: {
  isPro: boolean
  kind: "file" | "image"
}): { ok: boolean; error?: string } {
  if (args.isPro) return { ok: true }
  return {
    ok: false,
    error: `${args.kind} items are a Pro feature.`,
  }
}
