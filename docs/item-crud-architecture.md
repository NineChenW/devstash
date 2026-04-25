# Item CRUD Architecture

A unified design for creating, reading, updating, and deleting items across all 7 system types. One action file, one dynamic route, shared components that branch on `Item.contentType`.

## Sources & current state

- **Spec:** [context/project-overview.md](../context/project-overview.md), [context/coding-standards.md](../context/coding-standards.md)
- **Schema:** [prisma/schema.prisma](../prisma/schema.prisma) — `Item`, `ItemType`, `Tag`, `ItemCollection`
- **Type catalog:** [docs/item-types.md](item-types.md) (the type table the prompt called `content-types.md`)
- **System types & icon map:** [prisma/seed.ts:11-19](../prisma/seed.ts#L11-L19), [src/lib/icon-map.ts](../src/lib/icon-map.ts)
  - The prompt referenced `src/lib/constants.tsx` — that file does not exist; system types live in the seed and the iconMap.
- **Existing patterns to reuse:**
  - Data fetching: [src/lib/db/items.ts](../src/lib/db/items.ts), [src/lib/db/collections.ts](../src/lib/db/collections.ts), [src/lib/db/profile.ts](../src/lib/db/profile.ts) — pure async functions, called directly from server components.
  - Server actions: [src/actions/auth.ts](../src/actions/auth.ts) — `'use server'` files re-exported by feature.
  - Cards: [src/components/items/PinnedItem.tsx](../src/components/items/PinnedItem.tsx), [src/components/items/RecentItem.tsx](../src/components/items/RecentItem.tsx)
  - Modal primitive: [src/components/ui/modal.tsx](../src/components/ui/modal.tsx)

> Right now: only **dashboard reads** are wired up. Sidebar links to `/items/[type]s` exist but the route is not implemented. No item mutations exist yet. This doc is the plan for the next slice.

---

## Guiding principles

1. **Server-first.** List pages, item detail loads, and form prefills are server components fetching directly via Prisma. Only the drawer and form are `'use client'`.
2. **Mutations are server actions, not API routes.** [coding-standards.md](../context/coding-standards.md) reserves API routes for uploads with progress, webhooks, and external clients. Plain item create/update/delete fits the server-action mold.
3. **One mutation surface per noun.** All item mutations live in `src/actions/items.ts`. No per-type action files.
4. **Type variation is presentational, not structural.** The DB persists every item the same way. Per-type differences (which fields show, what the editor looks like) live in components, gated on `contentType` (and secondarily on `itemType.name`).
5. **`{success, data?, error?}` returns** from every action, matching the auth/profile pattern already in the codebase.
6. **Zod at the boundary.** One schema file, one schema per action, parsed at the top of the action.

---

## File structure

```
src/
├── actions/
│   └── items.ts                  ← createItem, updateItem, deleteItem,
│                                    toggleFavorite, togglePin, touchLastUsed
│
├── lib/
│   ├── db/
│   │   ├── items.ts              ← (existing) getPinnedItems, getRecentItems,
│   │   │                            getSystemItemTypesWithCounts
│   │   │                            (extend) getItemsByType, getItemById,
│   │   │                                     getItemTypeByName
│   │   └── tags.ts               ← (new) upsertTagsByName, list utility
│   ├── validation/
│   │   └── items.ts              ← (new) Zod schemas: createItemSchema,
│   │                                updateItemSchema, type→fields branches
│   └── items/
│       └── content-type.ts       ← (new) systemTypeToContentType('snippet') → 'text'
│
├── app/
│   ├── items/
│   │   ├── layout.tsx            ← reuses DashboardShell (sidebar + topbar)
│   │   └── [type]/
│   │       ├── page.tsx          ← list page; type segment is the URL slug
│   │       │                       (e.g. "snippets" → singular "snippet")
│   │       ├── loading.tsx
│   │       └── error.tsx
│   └── api/
│       └── upload/route.ts       ← (later) R2 signed-URL endpoint for file/image
│
└── components/
    └── items/
        ├── ItemCard.tsx          ← (new) shared list card; type-agnostic chrome
        ├── ItemList.tsx          ← (new) server component; renders ItemCard[]
        ├── ItemDrawer.tsx        ← (new) slide-over for create + edit
        ├── ItemForm.tsx          ← (new) form orchestrator (client)
        ├── ItemFormFields/       ← (new) per-contentType editor blocks
        │   ├── TextEditor.tsx    ← snippet/prompt/command/note
        │   ├── UrlEditor.tsx     ← link
        │   └── FileUploader.tsx  ← file/image (Pro)
        ├── PinnedItem.tsx        ← (existing)
        └── RecentItem.tsx        ← (existing)
```

---

## Routing: `/items/[type]`

Single dynamic segment, plural slug:

| URL                  | `params.type` | Resolves to system type |
| -------------------- | ------------- | ----------------------- |
| `/items/snippets`    | `snippets`    | `snippet`               |
| `/items/prompts`     | `prompts`     | `prompt`                |
| `/items/commands`    | `commands`    | `command`               |
| `/items/notes`       | `notes`       | `note`                  |
| `/items/files`       | `files`       | `file` _(Pro)_          |
| `/items/images`      | `images`      | `image` _(Pro)_         |
| `/items/links`       | `links`       | `link`                  |

`page.tsx` (server component) does:

1. `auth()` — redirect to `/sign-in?callbackUrl=...` when unauthenticated. (Cannot rely on [src/proxy.ts](../src/proxy.ts), which only matches `/dashboard/*`.)
2. Strip the trailing `s` → singular name. Look up via `getItemTypeByName(name)`. If unknown → `notFound()` (404).
3. Fetch items: `getItemsByType({ userId, itemTypeId, sort, search })`.
4. Render `<ItemList items={items} type={type} />`.
5. Pre-render an empty `<ItemDrawer />` (closed by default) so the topbar "+ New Item" button can open it via a URL param `?new=<type>` or a client store.

`generateStaticParams()` pre-bakes the seven valid slugs so unknown types fall through to `notFound()` cleanly.

The list page is **not** a layout — every type renders the same shell, but the data fetch is type-scoped. The shared chrome (sidebar, topbar) comes from `app/items/layout.tsx` (or a co-located shell), which receives `itemTypes` and `sidebarCollections` exactly the way `/dashboard/page.tsx` does today.

---

## Data fetching: `src/lib/db/items.ts`

All reads stay here. Server components import and `await` directly — no actions, no fetch indirection.

New exports:

```ts
// Lookup
export async function getItemTypeByName(name: string): Promise<ItemType | null>

// List (filtered + sorted)
export async function getItemsByType(opts: {
  userId: string
  itemTypeId: string
  sort?: 'recent' | 'oldest' | 'title'   // default 'recent'
  search?: string                         // ILIKE on title/description
}): Promise<ItemListRow[]>

// Detail (for drawer prefill via server component)
export async function getItemById(opts: {
  userId: string                          // ownership check baked in
  id: string
}): Promise<ItemDetail | null>
```

`ItemListRow` and `ItemDetail` are the existing `DashboardItem` shape extended with `content`, `language`, `fileUrl`, `fileName`, `fileSize`, `url`, `isPinned`, `lastUsedAt`, and `collections: { id, name }[]`. Each row already carries `typeIcon` / `typeColor` / `typeName` — no second lookup needed in the UI.

Always include `userId` in the `where` clause. There is no row-level ownership middleware; queries are the boundary.

---

## Mutations: `src/actions/items.ts`

One file. `'use server'` at the top. One Zod schema per export. Returns `{ success: true, data } | { success: false, error, code? }`.

```ts
'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createItemSchema, updateItemSchema } from '@/lib/validation/items'

export async function createItem(input: unknown)   // → { id }
export async function updateItem(input: unknown)   // → { id }
export async function deleteItem(input: { id: string })
export async function toggleFavorite(input: { id: string })
export async function togglePin(input: { id: string })
export async function touchLastUsed(input: { id: string })   // copy/use action
```

Each action does the same five steps:

1. **`session = await auth()`** → 401 (`{ success:false, code:'unauthorized' }`) if no session.
2. **`data = schema.parse(input)`** — Zod throws on invalid shape; catch and return `{ success:false, code:'validation', error: <flattened> }`.
3. **Ownership check on update/delete:** `prisma.item.findFirst({ where: { id, userId: session.user.id } })`. Missing → 404 (`code:'not-found'`).
4. **Mutate** inside a transaction when tags or collection links are involved (`prisma.$transaction([...])`).
5. **`revalidatePath`** for `/items/[type]`, `/dashboard`, and `/collections/[id]` for any linked collections. Return `{ success:true, data }`.

**Why one file?** All seven types share the same DB row shape. Branching by type happens once — when we set `contentType` from the chosen `itemType.name` — and is a one-line lookup, not a flow. Splitting into `createSnippet`, `createPrompt`, ... would just duplicate the same body seven times.

### `createItem` payload shape

The action takes a discriminated union, validated by Zod, where the discriminator is the **system type name** (not `contentType`):

```ts
{ type: 'snippet'  | 'prompt' | 'command' | 'note' ,
  title, description?, content, language?, tags[], collectionIds[], isPinned, isFavorite }

{ type: 'link',
  title, description?, url, tags[], collectionIds[], isPinned, isFavorite }

{ type: 'file' | 'image',
  title, description?, fileUrl, fileName, fileSize, tags[], collectionIds[], isPinned, isFavorite }
```

Inside the action, `type` → `itemTypeId` (lookup by `(name, isSystem:true)`) and `contentType` (`text | file | url`) via a small map in [src/lib/items/content-type.ts](../src/lib/items/content-type.ts). The DB stores both; the schema's `Item.contentType` is the column the UI reads.

### Tags

Tags use a global `Tag` model (`name @unique`). The action takes `tags: string[]` (names), runs `upsertTagsByName(names)` (a `tx.tag.upsert` per name), then `connect`s by id on the `Item.tags` relation. No per-user tag namespace.

### File uploads

Mutations take a `fileUrl` already pointing to R2 — they do **not** receive the binary. Upload happens via a client-side flow:

1. Client `POST /api/upload` → server returns a presigned PUT URL (the API route still has its place: progress + binary streaming).
2. Client PUTs the file directly to R2.
3. Client calls `createItem({ type: 'file' | 'image', fileUrl, fileName, fileSize, ... })`.

This keeps the server action serializable and small.

---

## Where type-specific logic lives

**Not** in actions, **not** in `lib/db`. Only in components.

| Concern                               | Location                                                  |
| ------------------------------------- | --------------------------------------------------------- |
| Which editor to render (code/markdown/url/upload) | `ItemForm` switches on `contentType`         |
| Syntax highlighting / language picker | `TextEditor` (only when system type is `snippet`)         |
| Markdown rendering                    | `TextEditor` (only when system type is `note`)            |
| URL preview / favicon                 | `UrlEditor`                                               |
| File picker, MIME validation          | `FileUploader`                                            |
| Pro gate on `file` / `image`          | `ItemDrawer` checks `session.user.isPro` before mounting `FileUploader` |
| Card chrome (icon, color, badges)     | `ItemCard` reads `typeIcon` / `typeColor` / `typeName` from the row — same as `PinnedItem` already does |

The DB shape is invariant. Action code is invariant. The presentation branches.

---

## Component responsibilities

### `ItemCard` (server-renderable)
- Renders a row's chrome: icon (via `iconMap`), colored left border, title, description, type pill, tag chips, pin/favorite indicators, date.
- Click → opens `ItemDrawer` in **edit** mode for that id (`?item=<id>`).
- For `link` type, optionally surfaces the URL inline.
- Same shape as `PinnedItem` / `RecentItem` — these can be deleted once `ItemCard` covers their use cases (a small follow-up).

### `ItemList` (server)
- Receives `items: ItemListRow[]` and the active type.
- Header: type icon + name + count, sort dropdown, search input, "+ New" button.
- Empty state with type-specific copy ("No snippets yet — save your first reusable code block").
- Maps to `<ItemCard />`.

### `ItemDrawer` (client)
- Slide-over wrapping `ItemForm`. Reuses the `[ui/modal.tsx](../src/components/ui/modal.tsx)` Escape-close + body-scroll-lock primitives but renders right-anchored, not centered.
- Two modes: `create` (no id, takes a default `type`) and `edit` (loads the item server-side via a route or accepts a prop from the parent server page).
- Open/close state lives in URL search params (`?new=<type>` / `?item=<id>`), so back/forward works and direct links open the drawer pre-filled.
- Footer: Save / Delete (edit only) / Cancel. Save calls `createItem` or `updateItem`; Delete calls `deleteItem`. Toasts via `sonner` on success.

### `ItemForm` (client)
- Owns: title, description, tags chip input, collection multi-select, isFavorite, isPinned.
- Switches on `systemType` to render one of `TextEditor` / `UrlEditor` / `FileUploader`.
- Calls server actions directly. No fetch, no JSON parsing. Disables submit while a `useTransition` is pending. Maps `code` from the action result to inline error placement.

### `TextEditor`
- Textarea by default. When `systemType === 'snippet'` shows a language dropdown bound to `language` (default from spec map: `typescript`, `python`, etc.) and a syntax-highlighted preview pane. When `systemType === 'note'` swaps in a markdown editor (per spec: "Markdown editor — Rich editing for text-based item types").
- One component, two modes — keeps the file count low.

### `UrlEditor`
- A single URL input, with light validation (`URL.canParse`) and an optional title-fetch button (later).

### `FileUploader`
- Drag-drop + file picker. Calls `/api/upload`, tracks progress, then surfaces `{ fileUrl, fileName, fileSize }` to the form.
- Renders **only** when the user is Pro. Otherwise the drawer shows an upgrade CTA.

---

## Cross-cutting helpers

- `src/lib/items/content-type.ts` — `systemTypeToContentType('snippet')` returns `'text'`. Single source of truth for the system-type ↔ `contentType` map; mirrors the table in [docs/item-types.md](item-types.md).
- `src/lib/validation/items.ts` — Zod schemas. Discriminated union on `type`. Reused by the form (client-side `safeParse` for instant feedback) and by server actions.
- `src/lib/db/tags.ts` — `upsertTagsByName(names: string[]): Promise<{ id: string; name: string }[]>`.
- `revalidatePath` calls colocated in actions — never in components.

---

## Migration & rollout order

1. Build `src/lib/items/content-type.ts`, extend `lib/db/items.ts` with `getItemTypeByName`, `getItemsByType`, `getItemById`.
2. Build `app/items/[type]/page.tsx` rendering `ItemList` with `ItemCard` (read-only first slice — verifies the route works for all 7 slugs).
3. Add `src/actions/items.ts` with `createItem` / `updateItem` / `deleteItem` and Zod schemas.
4. Build `ItemDrawer` + `ItemForm` + `TextEditor` + `UrlEditor`. Wire the topbar "+ New Item" → drawer.
5. Wire `toggleFavorite` / `togglePin` / `touchLastUsed` (the "use" action when content is copied).
6. Pro types: build `/api/upload` (R2 presigned URL) + `FileUploader`. Gate on `session.user.isPro`.
7. Replace `PinnedItem` / `RecentItem` with `ItemCard` once the unified card covers their use cases.

Each step is independently shippable.

---

## What this design deliberately does **not** do

- No per-type action files (`createSnippet`, `createPrompt`, ...). Same row shape → same action.
- No "items API" route. Server actions cover create/update/delete; uploads go through `/api/upload` because they need progress and binary streaming.
- No global state library. URL params (`?new=`, `?item=`) drive drawer state; `useTransition` covers pending UI.
- No row-level access middleware. Every query/mutation scopes by `userId` from `auth()`.
- No background job for `lastUsedAt` — `touchLastUsed` is fired explicitly from the copy/use button in the drawer.
