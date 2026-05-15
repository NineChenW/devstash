import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'

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
  // --- Clean existing data (order matters for foreign keys) ---
  console.log('Cleaning existing data...')
  await prisma.itemCollection.deleteMany()
  await prisma.item.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.itemType.deleteMany()
  console.log('  ✓ cleaned')

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

  const hashedPassword = await bcrypt.hash('12345678', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@devstash.io' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@devstash.io',
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  })
  console.log(`  ✓ ${user.name} (${user.email})`)

  // --- Tags ---
  console.log('Seeding tags...')

  const tagNames = [
    'react', 'hooks', 'typescript', 'patterns',
    'ai', 'prompts', 'workflow', 'code-review',
    'docker', 'devops', 'ci-cd', 'deployment',
    'git', 'terminal', 'shell', 'npm',
    'css', 'tailwind', 'ui', 'design',
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

  // React Patterns items (3 snippets)
  const reactPatternItems = [
    {
      title: 'useDebounce Hook',
      description: 'Custom hook to debounce rapidly changing values',
      contentType: 'text',
      content: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage:
// const debouncedSearch = useDebounce(searchTerm, 300);`,
      language: 'typescript',
      isFavorite: true,
      isPinned: true,
      itemType: 'snippet',
      tags: ['react', 'hooks', 'typescript'],
    },
    {
      title: 'Context Provider Pattern',
      description: 'Type-safe React context with provider and custom hook',
      contentType: 'text',
      content: `import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}`,
      language: 'typescript',
      isFavorite: false,
      isPinned: false,
      itemType: 'snippet',
      tags: ['react', 'patterns', 'typescript'],
    },
    {
      title: 'useLocalStorage Hook',
      description: 'Persist state to localStorage with SSR safety',
      contentType: 'text',
      content: `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      console.warn(\`Failed to save \${key} to localStorage\`);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

// Usage:
// const [name, setName] = useLocalStorage('user-name', '');`,
      language: 'typescript',
      isFavorite: true,
      isPinned: false,
      itemType: 'snippet',
      tags: ['react', 'hooks', 'typescript'],
    },
  ]

  // AI Workflows items (3 prompts)
  const aiWorkflowItems = [
    {
      title: 'Thorough Code Review',
      description: 'Prompt for detailed code review with actionable feedback',
      contentType: 'text',
      content: `You are a senior software engineer conducting a code review. Analyze the following code for:

1. **Correctness** — Logic errors, edge cases, off-by-one errors
2. **Security** — Injection, XSS, auth bypasses, data exposure
3. **Performance** — Unnecessary renders, N+1 queries, memory leaks
4. **Readability** — Naming, structure, complexity (suggest refactors)
5. **Best Practices** — Framework conventions, SOLID principles

For each issue found:
- Cite the exact line or block
- Explain why it's a problem
- Provide a concrete fix

End with a summary: what's good, what needs work, and a priority-ordered action list.`,
      isFavorite: true,
      isPinned: true,
      itemType: 'prompt',
      tags: ['ai', 'code-review', 'workflow'],
    },
    {
      title: 'Generate API Documentation',
      description: 'Prompt to generate clear REST API docs from code',
      contentType: 'text',
      content: `You are a technical writer. Given the following API route handler, generate documentation in this format:

## \`METHOD /path\`

**Description:** One-line summary

**Auth:** Required / None

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|

**Response:**
\`\`\`json
{ "example": "response" }
\`\`\`

**Status Codes:**
- 200 — Success
- 400 — Validation error
- 401 — Unauthorized

**Example:**
\`\`\`bash
curl -X METHOD /path -H "Authorization: Bearer token" -d '{}'
\`\`\`

Keep it concise. Infer types from the code. Flag any undocumented edge cases.`,
      isFavorite: false,
      isPinned: false,
      itemType: 'prompt',
      tags: ['ai', 'prompts', 'workflow'],
    },
    {
      title: 'Refactoring Assistant',
      description: 'Prompt for safe, incremental code refactoring',
      contentType: 'text',
      content: `You are an expert refactoring assistant. Given the following code:

1. Identify code smells (duplication, long methods, deep nesting, unclear naming)
2. Propose refactoring steps in a safe, incremental order — each step should leave the code in a working state
3. For each step:
   - Describe the refactoring technique (Extract Method, Replace Conditional with Polymorphism, etc.)
   - Show the before and after
   - Explain what improves and any risks

Constraints:
- Preserve existing behavior (no feature changes)
- Maintain all public interfaces
- Keep changes minimal and reviewable
- Prefer well-known refactoring patterns from Martin Fowler's catalog`,
      isFavorite: false,
      isPinned: false,
      itemType: 'prompt',
      tags: ['ai', 'prompts', 'code-review'],
    },
  ]

  // DevOps items (1 snippet, 1 command, 2 links)
  const devopsItems = [
    {
      title: 'Multi-stage Dockerfile',
      description: 'Production-optimized Dockerfile for Node.js apps',
      contentType: 'text',
      content: `# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]`,
      language: 'dockerfile',
      isFavorite: false,
      isPinned: false,
      itemType: 'snippet',
      tags: ['docker', 'devops', 'deployment'],
    },
    {
      title: 'Deploy with Health Check',
      description: 'Build, push Docker image, deploy, and verify health',
      contentType: 'text',
      content: `docker build -t myapp:latest . && \\
docker tag myapp:latest registry.example.com/myapp:latest && \\
docker push registry.example.com/myapp:latest && \\
echo "Deployed. Checking health..." && \\
curl -sf --retry 5 --retry-delay 3 https://myapp.example.com/api/health || echo "Health check failed"`,
      isFavorite: false,
      isPinned: false,
      itemType: 'command',
      tags: ['docker', 'devops', 'deployment'],
    },
    {
      title: 'GitHub Actions Documentation',
      description: 'Official docs for GitHub Actions workflows and syntax',
      contentType: 'url',
      url: 'https://docs.github.com/en/actions',
      isFavorite: false,
      isPinned: false,
      itemType: 'link',
      tags: ['ci-cd', 'devops'],
    },
    {
      title: 'Docker Hub',
      description: 'Container image registry and documentation',
      contentType: 'url',
      url: 'https://hub.docker.com',
      isFavorite: false,
      isPinned: false,
      itemType: 'link',
      tags: ['docker', 'devops'],
    },
  ]

  // Terminal Commands items (4 commands)
  const terminalItems = [
    {
      title: 'Interactive Rebase Last N Commits',
      description: 'Squash, reorder, or edit recent commits',
      contentType: 'text',
      content: `# Rebase last 5 commits interactively
git rebase -i HEAD~5

# Useful prefixes in the editor:
# pick   = keep commit as-is
# squash = merge into previous commit
# reword = change commit message
# drop   = remove commit entirely`,
      isFavorite: true,
      isPinned: false,
      itemType: 'command',
      tags: ['git', 'terminal'],
    },
    {
      title: 'Docker Cleanup',
      description: 'Remove unused containers, images, networks, and volumes',
      contentType: 'text',
      content: `# Remove all stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Nuclear option — remove everything unused
docker system prune -a --volumes -f`,
      isFavorite: false,
      isPinned: true,
      itemType: 'command',
      tags: ['docker', 'terminal', 'devops'],
    },
    {
      title: 'Find and Kill Process on Port',
      description: 'Find which process is using a port and kill it',
      contentType: 'text',
      content: `# Find process on port 3000 (macOS/Linux)
lsof -i :3000

# Kill it
kill -9 $(lsof -t -i :3000)

# Alternative using fuser (Linux)
fuser -k 3000/tcp`,
      isFavorite: false,
      isPinned: false,
      itemType: 'command',
      tags: ['terminal', 'shell'],
    },
    {
      title: 'NPM Dependency Audit',
      description: 'Check for outdated and vulnerable packages',
      contentType: 'text',
      content: `# Check for outdated packages
npm outdated

# Check for vulnerabilities
npm audit

# Auto-fix vulnerabilities (safe fixes only)
npm audit fix

# See what would update (dry run)
npm update --dry-run

# Interactively update to latest majors
npx npm-check-updates -i`,
      isFavorite: false,
      isPinned: false,
      itemType: 'command',
      tags: ['npm', 'terminal', 'shell'],
    },
  ]

  // Design Resources items (4 links)
  const designItems = [
    {
      title: 'Tailwind CSS Documentation',
      description: 'Official Tailwind CSS utility-first framework docs',
      contentType: 'url',
      url: 'https://tailwindcss.com/docs',
      isFavorite: true,
      isPinned: false,
      itemType: 'link',
      tags: ['tailwind', 'css', 'design'],
    },
    {
      title: 'shadcn/ui Components',
      description: 'Beautifully designed components built with Radix UI and Tailwind',
      contentType: 'url',
      url: 'https://ui.shadcn.com',
      isFavorite: true,
      isPinned: false,
      itemType: 'link',
      tags: ['ui', 'design', 'tailwind'],
    },
    {
      title: 'Radix UI Primitives',
      description: 'Unstyled, accessible UI primitives for React',
      contentType: 'url',
      url: 'https://www.radix-ui.com/primitives',
      isFavorite: false,
      isPinned: false,
      itemType: 'link',
      tags: ['ui', 'design'],
    },
    {
      title: 'Lucide Icons',
      description: 'Beautiful and consistent open-source icon library',
      contentType: 'url',
      url: 'https://lucide.dev/icons',
      isFavorite: false,
      isPinned: false,
      itemType: 'link',
      tags: ['ui', 'design'],
    },
  ]

  const allItems = [
    ...reactPatternItems.map((i) => ({ ...i, group: 'react' })),
    ...aiWorkflowItems.map((i) => ({ ...i, group: 'ai' })),
    ...devopsItems.map((i) => ({ ...i, group: 'devops' })),
    ...terminalItems.map((i) => ({ ...i, group: 'terminal' })),
    ...designItems.map((i) => ({ ...i, group: 'design' })),
  ]

  const createdItems: { id: string; tags: string[]; group: string }[] = []

  for (const item of allItems) {
    const { tags, itemType, group, ...data } = item
    const created = await prisma.item.create({
      data: {
        ...data,
        userId: user.id,
        itemTypeId: typeMap[itemType],
      },
    })
    createdItems.push({ id: created.id, tags, group })
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
      description: 'Reusable React patterns and hooks',
      isFavorite: true,
      defaultType: 'snippet',
      group: 'react',
    },
    {
      name: 'AI Workflows',
      description: 'AI prompts and workflow automations',
      isFavorite: true,
      defaultType: 'prompt',
      group: 'ai',
    },
    {
      name: 'DevOps',
      description: 'Infrastructure and deployment resources',
      isFavorite: false,
      defaultType: 'snippet',
      group: 'devops',
    },
  ]

  for (const col of collections) {
    const { defaultType, group, ...data } = col
    const created = await prisma.collection.create({
      data: {
        ...data,
        defaultTypeId: typeMap[defaultType],
        userId: user.id,
      },
    })

    // Associate items by group
    const groupItems = createdItems.filter((i) => i.group === group)
    for (const item of groupItems) {
      await prisma.itemCollection.create({
        data: {
          itemId: item.id,
          collectionId: created.id,
        },
      })
    }

    console.log(`  ✓ ${col.name} (${groupItems.length} items)`)
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
