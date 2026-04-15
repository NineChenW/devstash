# DevStash — Project Overview

> **One fast, searchable, AI-enhanced hub for all your dev knowledge & resources.**

---

## Table of Contents

1. [The Problem](#the-problem)
2. [Target Users](#target-users)
3. [Tech Stack](#tech-stack)
4. [Data Models & Prisma Schema](#data-models--prisma-schema)
5. [Features](#features)
6. [Item Types Reference](#item-types-reference)
7. [Monetization](#monetization)
8. [UI/UX Guidelines](#uiux-guidelines)
9. [App Architecture](#app-architecture)
10. [URL Structure](#url-structure)

---

## The Problem

Developers keep their essentials scattered across too many places:

| Asset             | Typical Location           |
| ----------------- | -------------------------- |
| Code snippets     | VS Code, Notion            |
| AI prompts        | Chat histories             |
| Context files     | Buried in project dirs     |
| Useful links      | Browser bookmarks          |
| Documentation     | Random folders             |
| Terminal commands | `.txt` files, bash history |
| Project templates | GitHub Gists               |

This creates context switching, lost knowledge, and inconsistent workflows. DevStash solves this with a single, unified hub.

---

## Target Users

| User Type                      | Primary Need                                         |
| ------------------------------ | ---------------------------------------------------- |
| **Everyday Developer**         | Quickly grab snippets, prompts, commands, and links  |
| **AI-first Developer**         | Save and organise prompts, contexts, system messages |
| **Content Creator / Educator** | Store code blocks, explanations, and course notes    |
| **Full-stack Builder**         | Collect patterns, boilerplates, and API examples     |

---

## Tech Stack

| Layer        | Choice                          | Notes                                                        |
| ------------ | ------------------------------- | ------------------------------------------------------------ |
| Framework    | **Next.js 16 / React 19**       | SSR + API routes in one repo                                 |
| Language     | **TypeScript**                  | End-to-end type safety                                       |
| Database     | **Neon (PostgreSQL)**           | Cloud-hosted Postgres                                        |
| ORM          | **Prisma 7**                    | [Latest docs](https://www.prisma.io/docs) — fetch before use |
| Cache        | **Redis**                       | TBD / optional                                               |
| File Storage | **Cloudflare R2**               | File & image uploads                                         |
| Auth         | **NextAuth v5**                 | Email/password + GitHub OAuth                                |
| AI           | **OpenAI `gpt-4o-mini`**        | Auto-tagging, summaries, explanations                        |
| Styling      | **Tailwind CSS v4 + ShadCN UI** | [ShadCN docs](https://ui.shadcn.com)                         |

> ⚠️ **DB Rule:** Never use `db push` or directly alter database structure. Always create and run migrations (`prisma migrate dev` → `prisma migrate deploy`).

---

## Data Models & Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                   String       @id @default(cuid())
  name                 String?
  email                String?      @unique
  emailVerified        DateTime?
  image                String?
  isPro                Boolean      @default(false)
  stripeCustomerId     String?      @unique
  stripeSubscriptionId String?      @unique
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt

  accounts    Account[]
  sessions    Session[]
  items       Item[]
  collections Collection[]
  itemTypes   ItemType[]   // user-created custom types
}

model Item {
  id          String   @id @default(cuid())
  title       String
  description String?
  contentType String   // "text" | "file" | "url"
  content     String?  // text content (null for file/url types)
  fileUrl     String?  // Cloudflare R2 URL
  fileName    String?  // original filename
  fileSize    Int?     // bytes
  url         String?  // for "link" type items
  language    String?  // e.g. "typescript", "python" (optional, for code)
  isFavorite  Boolean  @default(false)
  isPinned    Boolean  @default(false)
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  itemTypeId String
  itemType   ItemType @relation(fields: [itemTypeId], references: [id])

  tags        Tag[]            @relation("ItemTags")
  collections ItemCollection[]
}

model ItemType {
  id       String  @id @default(cuid())
  name     String  // "snippet" | "prompt" | "note" | "command" | "file" | "image" | "link"
  icon     String  // Lucide icon name
  color    String  // hex color
  isSystem Boolean @default(false)

  userId String? // null for system types
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items Item[]

  @@unique([name, userId]) // system types are unique globally; custom types per user
}

model Collection {
  id            String   @id @default(cuid())
  name          String
  description   String?
  isFavorite    Boolean  @default(false)
  defaultTypeId String?  // preferred item type for this collection
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  items ItemCollection[]
}

model ItemCollection {
  itemId       String
  collectionId String
  addedAt      DateTime @default(now())

  item       Item       @relation(fields: [itemId], references: [id], onDelete: Cascade)
  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([itemId, collectionId])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  items Item[] @relation("ItemTags")
}

// NextAuth required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

## Features

### A — Items & Item Types

Items are the core unit of DevStash. Each item has a **type** that controls its icon, color, and behaviour.

- **System types** (built-in, non-editable): `snippet`, `prompt`, `note`, `command`, `link`, `file` _(pro)_, `image` _(pro)_
- **Custom types** (pro, coming later): user-defined name, icon, and color
- Items open quickly in a **slide-over drawer** for fast access and creation

### B — Collections

- Users group items into named collections (e.g., _React Patterns_, _Interview Prep_)
- An item can belong to **multiple collections** simultaneously
- Collections have an optional `defaultTypeId` to pre-select a type for new items

### C — Search

Full-text search across:

- Item title
- Item content
- Tags
- Item type

### D — Authentication

- Email & password
- GitHub OAuth (via NextAuth v5)

### E — Core Features

| Feature               | Description                                   |
| --------------------- | --------------------------------------------- |
| Favorites             | Star collections and items                    |
| Pinning               | Pin items to appear at the top                |
| Recently used         | Track `lastUsedAt` and surface recent items   |
| Import                | Import code from a file directly into an item |
| Markdown editor       | Rich editing for text-based item types        |
| File upload           | Upload files/images to Cloudflare R2 (pro)    |
| Multi-collection      | Add/remove items to/from multiple collections |
| Collection membership | View which collections an item belongs to     |
| Export                | Download data as JSON or ZIP (pro)            |
| Dark mode             | Default; light mode also supported            |

### F — AI Features _(Pro only)_

| Feature           | Description                                  |
| ----------------- | -------------------------------------------- |
| Auto-tagging      | Suggest relevant tags based on item content  |
| AI Summary        | Generate a plain-language summary of an item |
| Explain This Code | Step-by-step explanation of a code snippet   |
| Prompt Optimizer  | Refine and improve AI prompts                |

> 🛠️ **Dev note:** During development, all users have access to all features regardless of `isPro`.

---

## Item Types Reference

| Type          | Icon         | Color   | Hex       | `contentType` |
| ------------- | ------------ | ------- | --------- | ------------- |
| Snippet       | `Code`       | Blue    | `#3b82f6` | `text`        |
| Prompt        | `Sparkles`   | Purple  | `#8b5cf6` | `text`        |
| Command       | `Terminal`   | Orange  | `#f97316` | `text`        |
| Note          | `StickyNote` | Yellow  | `#fde047` | `text`        |
| File _(pro)_  | `File`       | Gray    | `#6b7280` | `file`        |
| Image _(pro)_ | `Image`      | Pink    | `#ec4899` | `file`        |
| Link          | `Link`       | Emerald | `#10b981` | `url`         |

Icons are from [Lucide React](https://lucide.dev/icons/).

---

## Monetization

### Free Plan

- 50 items total
- 3 collections
- All system types **except** `file` and `image`
- Basic search
- No file/image uploads
- No AI features

### Pro Plan — $8/month or $72/year

- Unlimited items
- Unlimited collections
- `file` and `image` item types
- File & image uploads (Cloudflare R2)
- Custom types _(coming later)_
- All AI features
- Export as JSON / ZIP
- Priority support

Payments via **Stripe** — `stripeCustomerId` and `stripeSubscriptionId` stored on the `User` model.

---

## UI/UX Guidelines

### General Principles

- Modern, minimal, developer-focused aesthetic
- Dark mode by default; light mode available
- Reference apps: [Notion](https://notion.so), [Linear](https://linear.app), [Raycast](https://raycast.com)
- Clean typography, generous whitespace, subtle borders and shadows
- Syntax highlighting for all code blocks

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (collapsible)  │  Main Content Area         │
│                         │                            │
│  Item Types             │  Collections Grid          │
│  • Snippets             │  ┌──────┐ ┌──────┐        │
│  • Prompts              │  │      │ │      │        │
│  • Commands             │  └──────┘ └──────┘        │
│  • Notes                │                            │
│  • Links                │  Items under a collection  │
│                         │  ┌──────┐ ┌──────┐        │
│  ─────────────────      │  │      │ │      │        │
│  Collections            │  └──────┘ └──────┘        │
│  • React Patterns       │                            │
│  • Interview Prep       │                            │
└─────────────────────────────────────────────────────┘
```

- **Sidebar:** Item type links + latest collections
- **Main area:** Color-coded collection cards (background color = dominant item type color); items within collections shown as color-coded cards (border = item type color)
- **Item detail:** Opens in a slide-over drawer — no full page navigation
- **Mobile:** Sidebar becomes a drawer; desktop-first but mobile-usable

### Micro-interactions

- Smooth slide/fade transitions
- Hover states on all cards
- Toast notifications for create / update / delete / copy actions
- Loading skeletons while data fetches

### Design References

- [Notion](https://notion.so)
- Clean organization
- [Linear](https://linear.app)
- Modern dev aesthetic
- [Raycast](https://raycast.com)
- Quick access patterns

### Screenshots

Refer to the screenshots below as a base for th dashboard UI.
It does not have to be exact.
Use it as a reference:

@context/screenshots/dashboard-ui-main.png
@context/screenshots/dashboard-ui-drawer.png



---

## URL Structure

| Route               | Description                           |
| ------------------- | ------------------------------------- |
| `/`                 | Dashboard / home                      |
| `/items`            | All items                             |
| `/items/snippets`   | Items filtered by type: snippet       |
| `/items/prompts`    | Items filtered by type: prompt        |
| `/items/commands`   | Items filtered by type: command       |
| `/items/notes`      | Items filtered by type: note          |
| `/items/links`      | Items filtered by type: link          |
| `/items/files`      | Items filtered by type: file _(pro)_  |
| `/items/images`     | Items filtered by type: image _(pro)_ |
| `/collections`      | All collections                       |
| `/collections/[id]` | Single collection view                |
| `/search`           | Global search                         |
| `/settings`         | User settings, billing, export        |

---

## App Architecture

```
devstash/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + main shell
│   │   ├── page.tsx            # Dashboard home
│   │   ├── items/
│   │   │   └── [type]/page.tsx # /items/snippets, etc.
│   │   ├── collections/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── search/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── items/route.ts
│       ├── collections/route.ts
│       ├── upload/route.ts      # R2 file uploads
│       └── ai/
│           ├── tag/route.ts
│           ├── summarize/route.ts
│           ├── explain/route.ts
│           └── optimize/route.ts
├── components/
│   ├── sidebar/
│   ├── items/
│   │   ├── ItemCard.tsx
│   │   ├── ItemDrawer.tsx       # Slide-over for item detail/edit
│   │   └── ItemForm.tsx
│   ├── collections/
│   │   └── CollectionCard.tsx
│   └── ui/                     # ShadCN components
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── auth.ts                 # NextAuth config
│   ├── r2.ts                   # Cloudflare R2 client
│   └── ai.ts                   # OpenAI client
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── types/
    └── index.ts
```

---

_Last updated: April 2026_
