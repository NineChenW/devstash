# Prisma Database Setup

## Overview

This project uses **Prisma 7** with **Neon PostgreSQL** (serverless) via the `@prisma/adapter-neon` driver adapter.

## Key Information

### Prisma 7 Breaking Changes Applied

1. **Generator**: Uses `prisma-client` provider (not `prisma-client-js`) with explicit `output` path
2. **Datasource**: Connection URL removed from `schema.prisma` — configured in `prisma.config.ts` instead
3. **Driver adapter required**: `PrismaNeon` adapter used for all database connections (no bare `PrismaClient()`)
4. **Import path**: Import from `@/generated/prisma/client` (not `@prisma/client`)
5. **`prisma generate` is manual**: No longer runs automatically after `prisma migrate dev`
6. **`.env` not auto-loaded**: `prisma.config.ts` imports `dotenv/config` explicitly

For complete upgrade guide: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7

### Database Strategy

- **Development branch**: Create a development database in Neon for local development
- **Production branch**: Separate production database in Neon for deployed app
- Both use the same schema, different connection strings

### Environment Variables

Set in `.env.local`:

```
# Pooled connection — used by the app at runtime (PrismaNeon adapter)
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require"

# Direct connection — used by Prisma CLI for migrations (non-pooled)
DIRECT_URL="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require"
```

## Workflow

### Creating Migrations

Never use `db push`! Always use migrations:

```bash
# Create a new migration (also generates client)
npm run prisma:migrate -- --name add_feature_name

# Generate client only (no migration)
npm run prisma:generate

# Apply migrations in production (also generates client)
npm run prisma:deploy
```

### Checking Migration Status

```bash
npx prisma migrate status
```

### Accessing Prisma Studio

```bash
npm run prisma:studio
```

Opens a web UI at http://localhost:5555 to browse and edit data.

## Schema Overview

### Core Models

- **User**: Authentication and account management
- **Item**: Individual knowledge items (snippets, prompts, etc.)
- **ItemType**: Category for items (system and custom)
- **Collection**: Groups of items
- **ItemCollection**: Junction table for item-to-collection relationships
- **Tag**: Tags for items

### Authentication Models (NextAuth)

- **Account**: OAuth provider accounts
- **Session**: User sessions
- **VerificationToken**: Email verification tokens

## Indexes

Added indexes for frequently queried fields:

- `User.email` — authentication lookups
- `Item.userId`, `Item.itemTypeId`, `Item.isFavorite`, `Item.isPinned`, `Item.lastUsedAt` — filtering and sorting
- `ItemType.userId` — custom type lookups
- `Collection.userId`, `Collection.isFavorite` — collection queries
- `ItemCollection.itemId`, `ItemCollection.collectionId` — junction table lookups
- `Tag.name` — tag searches
- `Account.userId`, `Session.userId` — auth lookups

## Next Steps

1. Create Neon PostgreSQL account: https://console.neon.tech
2. Create a development database branch in Neon
3. Copy the pooled connection string to `.env.local` as `DATABASE_URL`
4. Copy the direct connection string to `.env.local` as `DIRECT_URL`
5. Run `npm run prisma:migrate -- --name init` to create the initial migration
6. Verify the database at https://console.neon.tech or with `npm run prisma:studio`

## Important Notes

- Never commit `.env.local` — it contains secrets
- Always create migrations before pushing schema changes
- Use `prisma migrate dev` for development
- Use `prisma migrate deploy` for production
- Use `prisma db seed` for seeding data (optional, coming later)
- Run `prisma generate` after every schema change (it's no longer automatic)
