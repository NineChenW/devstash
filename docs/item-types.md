# Item Types Reference

Documentation of the seven system item types in DevStash, captured from the canonical sources:

- [context/project-overview.md](../context/project-overview.md) — spec
- [prisma/schema.prisma](../prisma/schema.prisma) — `Item` and `ItemType` models
- [prisma/seed.ts:11-19](../prisma/seed.ts#L11-L19) — system type seeding (icon + hex color)
- [src/lib/icon-map.ts](../src/lib/icon-map.ts) — Lucide icon resolver
- [src/components/sidebar/Sidebar.tsx:18](../src/components/sidebar/Sidebar.tsx#L18) — `PRO_TYPES = {file, image}`

> The prompt referenced `src/lib/constants.tsx`, but no such file exists. The system type table is defined inline in [prisma/seed.ts:11-19](../prisma/seed.ts#L11-L19), and icon resolution lives in [src/lib/icon-map.ts](../src/lib/icon-map.ts).

---

## At a glance

| Type    | Lucide icon  | Color   | Hex       | `Item.contentType` | Tier     | Storage focus              |
| ------- | ------------ | ------- | --------- | ------------------ | -------- | -------------------------- |
| snippet | `Code`       | Blue    | `#3b82f6` | `text`             | Free     | `content` + `language`     |
| prompt  | `Sparkles`   | Purple  | `#8b5cf6` | `text`             | Free     | `content`                  |
| command | `Terminal`   | Orange  | `#f97316` | `text`             | Free     | `content`                  |
| note    | `StickyNote` | Yellow  | `#fde047` | `text`             | Free     | `content` (markdown)       |
| file    | `File`       | Gray    | `#6b7280` | `file`             | **Pro**  | `fileUrl` + `fileName` + `fileSize` |
| image   | `Image`      | Pink    | `#ec4899` | `file`             | **Pro**  | `fileUrl` + `fileName` + `fileSize` |
| link    | `Link`       | Emerald | `#10b981` | `url`              | Free     | `url`                      |

Fixed display order across the app: **snippet → prompt → command → note → file → image → link** (see [src/lib/db/items.ts:23](../src/lib/db/items.ts#L23) and [src/lib/db/profile.ts:25](../src/lib/db/profile.ts#L25)).

---

## Per-type detail

### Snippet
- **Name:** `snippet`
- **Icon:** `Code` (Lucide)
- **Color:** Blue · `#3b82f6`
- **Purpose:** Reusable code blocks — hooks, components, utility functions, patterns. The default code-storage type.
- **Key fields:** `title`, `description`, `content` (the code), `language` (e.g. `typescript`, `dockerfile`).
- **Example seed item:** `useDebounce Hook` ([prisma/seed.ts:113-136](../prisma/seed.ts#L113-L136))

### Prompt
- **Name:** `prompt`
- **Icon:** `Sparkles`
- **Color:** Purple · `#8b5cf6`
- **Purpose:** Reusable AI prompts — system messages, code-review prompts, refactoring assistants.
- **Key fields:** `title`, `description`, `content` (the prompt text). `language` is unused.
- **Example seed item:** `Thorough Code Review` ([prisma/seed.ts:215-236](../prisma/seed.ts#L215-L236))

### Command
- **Name:** `command`
- **Icon:** `Terminal`
- **Color:** Orange · `#f97316`
- **Purpose:** Shell / CLI commands — git incantations, docker cleanup, deploy chains.
- **Key fields:** `title`, `description`, `content` (the command, often multi-line). `language` optional.
- **Example seed item:** `Interactive Rebase Last N Commits` ([prisma/seed.ts:374-390](../prisma/seed.ts#L374-L390))

### Note
- **Name:** `note`
- **Icon:** `StickyNote`
- **Color:** Yellow · `#fde047`
- **Purpose:** Free-form developer notes — design decisions, todos, study notes. Spec calls out a markdown editor for text-based types.
- **Key fields:** `title`, `description`, `content` (markdown).
- **Example seed item:** _(none in current seed; covered in spec only)_

### File _(Pro)_
- **Name:** `file`
- **Icon:** `File`
- **Color:** Gray · `#6b7280`
- **Purpose:** Arbitrary file uploads (PDFs, archives, configs). Gated to Pro because uploads consume Cloudflare R2 storage.
- **Key fields:** `fileUrl` (R2 URL), `fileName` (original), `fileSize` (bytes). `content` is null.
- **Pro gate:** [src/components/sidebar/Sidebar.tsx:18](../src/components/sidebar/Sidebar.tsx#L18) lists `file` in `PRO_TYPES` for the sidebar PRO badge.
- **Example seed item:** _(no seed; type-only — file uploads not yet implemented)_

### Image _(Pro)_
- **Name:** `image`
- **Icon:** `Image`
- **Color:** Pink · `#ec4899`
- **Purpose:** Image uploads — screenshots, diagrams, design references. Same R2 backing as `file` but rendered as an image.
- **Key fields:** Same as file (`fileUrl`, `fileName`, `fileSize`).
- **Pro gate:** Same as `file`.
- **Example seed item:** _(no seed; type-only)_

### Link
- **Name:** `link`
- **Icon:** `Link` (mapped from `Link as LinkIcon` to avoid clashing with Next.js `Link`, see [src/lib/icon-map.ts:6](../src/lib/icon-map.ts#L6))
- **Color:** Emerald · `#10b981`
- **Purpose:** Bookmarked URLs — docs, references, tools.
- **Key fields:** `url` (the link). `content` is null.
- **Example seed item:** `Tailwind CSS Documentation` ([prisma/seed.ts:455-464](../prisma/seed.ts#L455-L464))

---

## `contentType` classification

`Item.contentType` is a free-form string (not an enum) with three accepted values. It determines which payload column is authoritative. Source: [prisma/schema.prisma:37-42](../prisma/schema.prisma#L37-L42).

| `contentType` | Authoritative columns                      | Null columns          | Types using it                  |
| ------------- | ------------------------------------------ | --------------------- | ------------------------------- |
| `text`        | `content` (+ optional `language`)          | `fileUrl`, `fileName`, `fileSize`, `url` | snippet, prompt, command, note  |
| `file`        | `fileUrl`, `fileName`, `fileSize`          | `content`, `url`      | file, image                     |
| `url`         | `url`                                      | `content`, `fileUrl`, `fileName`, `fileSize` | link               |

Note that `contentType` is independent of `itemTypeId` — multiple item types share the same `contentType`. The `itemType` relation drives icon/color/display; `contentType` drives which payload column the UI reads.

---

## Shared `Item` properties

Every item — regardless of type — has these fields ([prisma/schema.prisma:33-64](../prisma/schema.prisma#L33-L64)):

- **Identity:** `id` (cuid), `userId`, `itemTypeId`
- **Display:** `title` (required), `description` (optional)
- **Flags:** `isFavorite` (default `false`), `isPinned` (default `false`)
- **Activity:** `lastUsedAt` (nullable; powers Recent Items), `createdAt`, `updatedAt`
- **Relations:** `tags` (many-to-many via `Tag`), `collections` (many-to-many via `ItemCollection`)
- **Indexes:** `userId`, `itemTypeId`, `isFavorite`, `isPinned`, `lastUsedAt`

---

## Display differences

### Icons
All seven types resolve through [src/lib/icon-map.ts](../src/lib/icon-map.ts). The seed stores the Lucide icon **name** as a string (`Code`, `Sparkles`, `Terminal`, `StickyNote`, `File`, `Image`, `Link`) on `ItemType.icon`; the icon-map turns it back into a React component at render time. Default fallback is `Code` (`DefaultIcon`).

### Color usage
`ItemType.color` (hex) is applied as:
- **CollectionCard:** background tint derived from the collection's dominant item type
- **ItemCard / PinnedItem / RecentItem:** colored left border
- **Sidebar:** dot indicator next to recent collections

### Sidebar PRO badge
[src/components/sidebar/Sidebar.tsx:18-90](../src/components/sidebar/Sidebar.tsx#L18-L90) renders a small outlined `PRO` badge between the type name and count for `file` and `image`. The badge is hidden when the sidebar is collapsed. Free types render no badge.

### Per-type filter routes
Each system type has a dedicated list page at `/items/[name]s` (e.g. `/items/snippets`, `/items/files`). Pro types still appear in the sidebar with the badge, but the list pages will be feature-gated when uploads ship.

---

## System vs custom types

`ItemType.isSystem = true` and `userId = null` mark the seven shipped types ([prisma/seed.ts:39-64](../prisma/seed.ts#L39-L64)). The schema reserves space for **custom types** (`isSystem = false`, `userId = <user>`) — a roadmap Pro feature; not yet implemented. Uniqueness is enforced via `@@unique([name, userId])`, so each user can have their own `meeting-note` (or whatever) without colliding with anyone else's.
