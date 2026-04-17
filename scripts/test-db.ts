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

  // --- Demo User ---
  const user = await prisma.user.findUnique({
    where: { email: 'demo@devstash.io' },
  })

  if (!user) {
    console.error('✗ Demo user not found')
    process.exit(1)
  }

  console.log('Demo User:')
  console.log(`  Name:          ${user.name}`)
  console.log(`  Email:         ${user.email}`)
  console.log(`  isPro:         ${user.isPro}`)
  console.log(`  Password hash: ${user.password ? '✓ set' : '✗ missing'}`)
  console.log(`  Verified:      ${user.emailVerified ? '✓' : '✗'}`)

  // --- Table Counts ---
  const [users, itemTypes, items, tags, collections, itemCollections] =
    await Promise.all([
      prisma.user.count(),
      prisma.itemType.count(),
      prisma.item.count(),
      prisma.tag.count(),
      prisma.collection.count(),
      prisma.itemCollection.count(),
    ])

  console.log('\nTable counts:')
  console.log(`  Users:            ${users}`)
  console.log(`  Item Types:       ${itemTypes}`)
  console.log(`  Items:            ${items}`)
  console.log(`  Tags:             ${tags}`)
  console.log(`  Collections:      ${collections}`)
  console.log(`  Item-Collections: ${itemCollections}`)

  // --- System Item Types ---
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    orderBy: { name: 'asc' },
  })
  console.log('\nSystem item types:')
  for (const t of systemTypes) {
    console.log(`  ${t.icon.padEnd(12)} ${t.name.padEnd(10)} ${t.color}`)
  }

  // --- Collections with Items ---
  const allCollections = await prisma.collection.findMany({
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true, tags: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  console.log('\nCollections:')
  for (const col of allCollections) {
    const fav = col.isFavorite ? ' ★' : ''
    console.log(`\n  ${col.name}${fav}`)
    console.log(`  ${col.description}`)
    for (const ic of col.items) {
      const item = ic.item
      const tags = item.tags.map((t) => t.name).join(', ')
      const type = item.itemType.name.padEnd(8)
      const pin = item.isPinned ? ' 📌' : ''
      const heart = item.isFavorite ? ' ♥' : ''
      console.log(`    [${type}] ${item.title}${pin}${heart} — ${tags}`)
    }
  }

  // --- Items not in any collection ---
  const orphanItems = await prisma.item.findMany({
    where: { collections: { none: {} } },
    include: { itemType: true },
  })
  if (orphanItems.length > 0) {
    console.log(`\nItems without a collection: ${orphanItems.length}`)
    for (const item of orphanItems) {
      console.log(`  [${item.itemType.name}] ${item.title}`)
    }
  }

  console.log('\n✓ All checks passed.')
}

main()
  .catch((e) => {
    console.error('✗ Database test failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
