'use server'

import { auth } from '@/auth'
import { getDemoUserId } from '@/lib/db/collections'
import { getSearchData, type SearchData } from '@/lib/db/search'

export async function fetchSearchData(): Promise<SearchData> {
  const session = await auth()
  if (!session?.user?.id) {
    return { items: [], collections: [] }
  }
  const ownerId = (await getDemoUserId()) ?? session.user.id
  return getSearchData(ownerId)
}
