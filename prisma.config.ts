import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    // Direct (non-pooled) connection for migrations
    // Falls back to DATABASE_URL for environments where DIRECT_URL is not set
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
})
