import 'dotenv/config'
import { createInterface } from 'readline'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const KEEP_EMAIL = 'demo@devstash.io'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function confirm(question: string): Promise<boolean> {
  if (process.argv.includes('--yes') || process.argv.includes('-y')) return true
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'yes')
    })
  })
}

async function main() {
  const url = process.env.DATABASE_URL || ''
  if (url.includes('production') || url.includes('prod')) {
    console.error('✗ Refusing to run: DATABASE_URL looks like production.')
    process.exit(1)
  }

  const keep = await prisma.user.findUnique({
    where: { email: KEEP_EMAIL },
    select: { id: true, email: true, name: true },
  })
  if (!keep) {
    console.error(`✗ Keep user "${KEEP_EMAIL}" not found. Aborting.`)
    process.exit(1)
  }

  const toDelete = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true, name: true },
  })

  const staleTokens = await prisma.verificationToken.count({
    where: { identifier: { not: KEEP_EMAIL } },
  })

  console.log('About to delete:')
  console.log(`  Users:               ${toDelete.length}`)
  for (const u of toDelete) {
    console.log(`    - ${u.email ?? '(no email)'} (${u.id})`)
  }
  console.log(`  Verification tokens: ${staleTokens} (for non-kept emails)`)
  console.log(`\nKeeping: ${keep.email} (${keep.id})`)
  console.log(
    '\nNote: cascades will also remove each deleted user\'s accounts, sessions,',
  )
  console.log('      items, collections, and custom item types. System item types stay.\n')

  if (toDelete.length === 0 && staleTokens === 0) {
    console.log('Nothing to delete. Done.')
    return
  }

  const ok = await confirm('Type "yes" to proceed: ')
  if (!ok) {
    console.log('Aborted.')
    return
  }

  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { not: KEEP_EMAIL } },
  })
  const deletedTokens = await prisma.verificationToken.deleteMany({
    where: { identifier: { not: KEEP_EMAIL } },
  })

  console.log(`\n✓ Deleted ${deletedUsers.count} users (with cascaded data).`)
  console.log(`✓ Deleted ${deletedTokens.count} stale verification tokens.`)

  const [userCount, itemCount, collectionCount, accountCount, sessionCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.item.count(),
      prisma.collection.count(),
      prisma.account.count(),
      prisma.session.count(),
    ])

  console.log('\nPost-cleanup counts:')
  console.log(`  Users:       ${userCount}`)
  console.log(`  Items:       ${itemCount}`)
  console.log(`  Collections: ${collectionCount}`)
  console.log(`  Accounts:    ${accountCount}`)
  console.log(`  Sessions:    ${sessionCount}`)
}

main()
  .catch((e) => {
    console.error('✗ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
