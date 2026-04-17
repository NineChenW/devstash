import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Testing database connection...\n')

  // Test connection
  const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW()`
  console.log(`✓ Connected at ${result[0].now}\n`)

  // Count all tables
  const [users, itemTypes, items, tags, collections, itemCollections] =
    await Promise.all([
      prisma.user.count(),
      prisma.itemType.count(),
      prisma.item.count(),
      prisma.tag.count(),
      prisma.collection.count(),
      prisma.itemCollection.count(),
    ])

  console.log('Table counts:')
  console.log(`  Users:            ${users}`)
  console.log(`  Item Types:       ${itemTypes}`)
  console.log(`  Items:            ${items}`)
  console.log(`  Tags:             ${tags}`)
  console.log(`  Collections:      ${collections}`)
  console.log(`  Item-Collections: ${itemCollections}`)

  // List system item types
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    orderBy: { name: 'asc' },
  })
  console.log('\nSystem item types:')
  for (const t of systemTypes) {
    console.log(`  ${t.icon.padEnd(12)} ${t.name.padEnd(10)} ${t.color}`)
  }

  // List items with their types and tags
  const allItems = await prisma.item.findMany({
    include: { itemType: true, tags: true },
    orderBy: { createdAt: 'asc' },
  })
  console.log('\nItems:')
  for (const item of allItems) {
    const tags = item.tags.map((t) => t.name).join(', ')
    console.log(`  [${item.itemType.name}] ${item.title} — ${tags || 'no tags'}`)
  }

  // List collections with item counts
  const allCollections = await prisma.collection.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: 'asc' },
  })
  console.log('\nCollections:')
  for (const col of allCollections) {
    const fav = col.isFavorite ? ' ★' : ''
    console.log(`  ${col.name} (${col._count.items} items)${fav}`)
  }

  console.log('\n✓ All tests passed.')
}

main()
  .catch((e) => {
    console.error('✗ Database test failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
