import { PrismaClient } from '@/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

const systemItemTypes = [
  { name: 'snippet', icon: 'Code', color: '#3b82f6' },
  { name: 'prompt', icon: 'Sparkles', color: '#8b5cf6' },
  { name: 'command', icon: 'Terminal', color: '#f97316' },
  { name: 'note', icon: 'StickyNote', color: '#fde047' },
  { name: 'file', icon: 'File', color: '#6b7280' },
  { name: 'image', icon: 'Image', color: '#ec4899' },
  { name: 'link', icon: 'Link', color: '#10b981' },
]

async function main() {
  // --- System Item Types ---
  console.log('Seeding system item types...')

  const typeMap: Record<string, string> = {}

  for (const type of systemItemTypes) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, isSystem: true, userId: null },
    })

    if (existing) {
      await prisma.itemType.update({
        where: { id: existing.id },
        data: { icon: type.icon, color: type.color },
      })
      typeMap[type.name] = existing.id
      console.log(`  ✓ ${type.name} (updated)`)
    } else {
      const created = await prisma.itemType.create({
        data: {
          name: type.name,
          icon: type.icon,
          color: type.color,
          isSystem: true,
          userId: null,
        },
      })
      typeMap[type.name] = created.id
      console.log(`  ✓ ${type.name} (created)`)
    }
  }

  // --- Demo User ---
  console.log('Seeding demo user...')

  const user = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Developer',
      email: 'john@example.com',
      isPro: true,
    },
  })
  console.log(`  ✓ ${user.name} (${user.email})`)

  // --- Tags ---
  console.log('Seeding tags...')

  const tagNames = [
    'react', 'hooks', 'auth', 'typescript', 'nextjs',
    'api', 'error-handling', 'fetch', 'git', 'docker',
    'python', 'prisma', 'database', 'css', 'testing',
  ]

  const tagMap: Record<string, string> = {}

  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    tagMap[name] = tag.id
  }
  console.log(`  ✓ ${tagNames.length} tags`)

  // --- Items ---
  console.log('Seeding items...')

  const items = [
    {
      title: 'React useState Hook',
      description: 'Basic usage of useState in React',
      contentType: 'text',
      content: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
      language: 'typescript',
      isFavorite: true,
      isPinned: true,
      itemType: 'snippet',
      tags: ['react', 'hooks'],
    },
    {
      title: 'Generate React Components',
      description: 'Prompt for generating React components',
      contentType: 'text',
      content: 'You are an expert React developer. Create a well-structured React component with TypeScript that includes proper state management, props interface, and responsive design. The component should follow React best practices and include proper TypeScript types.',
      isFavorite: false,
      isPinned: true,
      itemType: 'prompt',
      tags: ['react', 'typescript'],
    },
    {
      title: 'Create Next.js App',
      description: 'Command to create a new Next.js application',
      contentType: 'text',
      content: 'npx create-next-app@latest my-app --typescript --tailwind --eslint --app',
      isFavorite: false,
      isPinned: false,
      itemType: 'command',
      tags: ['nextjs', 'typescript'],
    },
    {
      title: 'Project Architecture Notes',
      description: 'Notes about project architecture decisions',
      contentType: 'text',
      content: 'Key decisions:\n- Use Next.js 14 with App Router\n- Implement TypeScript for type safety\n- Use Tailwind CSS for styling\n- Structure components in feature-based folders\n- Implement proper error boundaries',
      isFavorite: true,
      isPinned: false,
      itemType: 'note',
      tags: ['nextjs', 'typescript'],
    },
    {
      title: 'React Documentation',
      description: 'Official React documentation',
      contentType: 'url',
      url: 'https://react.dev',
      isFavorite: false,
      isPinned: false,
      itemType: 'link',
      tags: ['react'],
    },
    {
      title: 'Prisma Client Singleton',
      description: 'Prevent multiple Prisma instances in Next.js dev mode',
      contentType: 'text',
      content: `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`,
      language: 'typescript',
      isFavorite: true,
      isPinned: false,
      itemType: 'snippet',
      tags: ['prisma', 'nextjs', 'typescript'],
    },
    {
      title: 'Write API Documentation',
      description: 'Prompt for generating clear API docs',
      contentType: 'text',
      content: 'You are a technical writer. Given the following API route, write clear and concise documentation including: endpoint, method, request body, response schema, and example usage.',
      isFavorite: false,
      isPinned: false,
      itemType: 'prompt',
      tags: ['api'],
    },
    {
      title: 'Docker Run Dev Container',
      description: 'Run a Node.js app in Docker with hot reload',
      contentType: 'text',
      content: 'docker run -it --rm -v $(pwd):/app -w /app -p 3000:3000 node:20-alpine sh',
      isFavorite: false,
      isPinned: false,
      itemType: 'command',
      tags: ['docker'],
    },
    {
      title: 'Database Schema Decisions',
      description: 'Notes on schema design choices for the project',
      contentType: 'text',
      content: '- Use cuid() for IDs (better for distributed systems than UUID)\n- Soft deletes via deletedAt field\n- Always store timestamps in UTC\n- Use enums sparingly — prefer string fields with validation',
      isFavorite: false,
      isPinned: false,
      itemType: 'note',
      tags: ['database', 'prisma'],
    },
    {
      title: 'Prisma Docs',
      description: 'Official Prisma ORM documentation',
      contentType: 'url',
      url: 'https://www.prisma.io/docs',
      isFavorite: false,
      isPinned: false,
      itemType: 'link',
      tags: ['prisma', 'database'],
    },
    {
      title: 'NextAuth v5 Setup',
      description: 'Minimal NextAuth v5 config with GitHub provider',
      contentType: 'text',
      content: `import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
})`,
      language: 'typescript',
      isFavorite: true,
      isPinned: false,
      itemType: 'snippet',
      tags: ['nextjs', 'auth'],
    },
    {
      title: 'Code Review Assistant',
      description: 'Prompt for thorough code review feedback',
      contentType: 'text',
      content: 'Review the following code for: correctness, security issues, performance concerns, readability, and adherence to SOLID principles. Be specific and suggest concrete improvements.',
      isFavorite: false,
      isPinned: false,
      itemType: 'prompt',
      tags: ['testing'],
    },
    {
      title: 'Git Stash Workflow',
      description: 'Stash, switch branch, and restore changes',
      contentType: 'text',
      content: 'git stash push -m "wip: feature description"\ngit checkout main\n# ... do work ...\ngit checkout -\ngit stash pop',
      isFavorite: false,
      isPinned: false,
      itemType: 'command',
      tags: ['git'],
    },
    {
      title: 'TypeScript Strict Mode Notes',
      description: 'What strict mode enables and why it matters',
      contentType: 'text',
      content: 'Strict mode enables: strictNullChecks, noImplicitAny, strictFunctionTypes, strictPropertyInitialization. Always enable — catching these at compile time saves hours of runtime debugging.',
      isFavorite: false,
      isPinned: false,
      itemType: 'note',
      tags: ['typescript'],
    },
    {
      title: 'TypeScript Handbook',
      description: 'The official TypeScript language handbook',
      contentType: 'url',
      url: 'https://www.typescriptlang.org/docs/handbook',
      isFavorite: false,
      isPinned: false,
      itemType: 'link',
      tags: ['typescript'],
    },
  ]

  const createdItems: { id: string; tags: string[] }[] = []

  for (const item of items) {
    const { tags, itemType, ...data } = item
    const created = await prisma.item.create({
      data: {
        ...data,
        userId: user.id,
        itemTypeId: typeMap[itemType],
      },
    })
    createdItems.push({ id: created.id, tags })
    console.log(`  ✓ ${item.title}`)
  }

  // --- Connect Tags to Items ---
  console.log('Connecting tags to items...')

  for (const { id, tags } of createdItems) {
    await prisma.item.update({
      where: { id },
      data: {
        tags: {
          connect: tags.map((name) => ({ id: tagMap[name] })),
        },
      },
    })
  }
  console.log(`  ✓ tags connected`)

  // --- Collections ---
  console.log('Seeding collections...')

  const collections = [
    {
      name: 'React Patterns',
      description: 'Common React patterns and hooks',
      isFavorite: true,
      defaultType: 'snippet',
    },
    {
      name: 'Python Snippets',
      description: 'Useful Python code snippets',
      isFavorite: false,
      defaultType: 'snippet',
    },
    {
      name: 'Context Files',
      description: 'AI context files for projects',
      isFavorite: true,
      defaultType: 'file',
    },
    {
      name: 'Interview Prep',
      description: 'Technical interview preparation',
      isFavorite: false,
      defaultType: 'snippet',
    },
    {
      name: 'Git Commands',
      description: 'Frequently used git commands',
      isFavorite: true,
      defaultType: 'command',
    },
    {
      name: 'AI Prompts',
      description: 'Curated AI prompts for coding',
      isFavorite: false,
      defaultType: 'prompt',
    },
  ]

  const createdCollections: string[] = []

  for (const col of collections) {
    const { defaultType, ...data } = col
    const created = await prisma.collection.create({
      data: {
        ...data,
        defaultTypeId: typeMap[defaultType],
        userId: user.id,
      },
    })
    createdCollections.push(created.id)
    console.log(`  ✓ ${col.name}`)
  }

  // --- Item-Collection Associations ---
  console.log('Seeding item-collection associations...')

  const associations = [
    // React Patterns: React useState, Prisma Singleton, NextAuth Setup
    { itemIdx: 0, colIdx: 0 },
    { itemIdx: 5, colIdx: 0 },
    { itemIdx: 10, colIdx: 0 },
    // Interview Prep: Architecture Notes, Strict Mode Notes, Code Review
    { itemIdx: 3, colIdx: 3 },
    { itemIdx: 13, colIdx: 3 },
    { itemIdx: 11, colIdx: 3 },
    // Git Commands: Git Stash, Create Next.js App
    { itemIdx: 12, colIdx: 4 },
    { itemIdx: 2, colIdx: 4 },
    // AI Prompts: Generate Components, Write API Docs, Code Review
    { itemIdx: 1, colIdx: 5 },
    { itemIdx: 6, colIdx: 5 },
    { itemIdx: 11, colIdx: 5 },
  ]

  for (const { itemIdx, colIdx } of associations) {
    await prisma.itemCollection.create({
      data: {
        itemId: createdItems[itemIdx].id,
        collectionId: createdCollections[colIdx],
      },
    })
  }
  console.log(`  ✓ ${associations.length} associations`)

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
