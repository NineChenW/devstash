# Update Rules

!!! Read this before update. !!!
Do not violate any following rules:

1. Please keep all the comments stay the same.
2. Do not delete the existing history records.
3. Only add a new history record after a feature is stetted completed.
4. Fill the current feature area with the current active feature title.
5. Update status to "In Progress" when starting a new feature.
6. Update status to "Completed" when finishing a feature.
7. Update goals section with current feature requirements.
8. Update notes section with current feature references.

# Current Feature

<!--Feature Name-->

Auth Phase 1 - NextAuth + GitHub Provider

## Status

<!--Not Started|In Progress|Completed-->

In Progress

## Goals

<!--Goals & requirements-->

- Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`
- Set up split auth config pattern for edge compatibility (`src/auth.config.ts` + `src/auth.ts`)
- Add GitHub OAuth provider
- Create `src/app/api/auth/[...nextauth]/route.ts` exporting handlers from `auth.ts`
- Create `src/proxy.ts` to protect `/dashboard/*` routes via Next.js 16 proxy
- Redirect unauthenticated users to NextAuth's default sign-in page
- Extend Session type with `user.id` via `src/types/next-auth.d.ts`
- Add `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` env vars

## Notes

<!--Any extra notes-->

Spec: `context/features/auth-phase-1-spec.md`

Key gotchas:
- Use `next-auth@beta` (not `@latest` which installs v4)
- Proxy file must live at `src/proxy.ts` (same level as `app/`)
- Use named export `export const proxy = auth(...)` (not default)
- Use `session: { strategy: 'jwt' }` with the split config pattern
- Don't set a custom `pages.signIn` — rely on NextAuth's default page
- Verify current config/conventions with Context7 before coding

Testing:
1. Visit `/dashboard` unauthenticated → should redirect to sign-in
2. Click "Sign in with GitHub" → complete OAuth
3. Verify redirect back to `/dashboard` after auth

References:
- Edge compatibility: https://authjs.dev/getting-started/installation#edge-compatibility
- Prisma adapter: https://authjs.dev/getting-started/adapters/prisma


## History

<!--
Keep this updated.
Earliest to latest.
-->

- **2026-04-14**: Initial Next.js and Tailwind CSS v4 setup - Created project structure, coding standards, and AI interaction guidelines. Committed with message "chore: initial next.js and tailwind setup".
- **2026-04-15**: Dashboard UI Phase 1 implementation - Initialized ShadCN UI components, created dashboard route at /dashboard, implemented dark mode by default, added top bar with search and new item button, created sidebar and main area placeholders.
- **2026-04-16**: Dashboard UI Phase 2 implementation - Implemented collapsible sidebar with item types links, favorite collections, most recent collections, user avatar area, drawer icon for mobile/desktop toggle, fixed hydration error with mounted state, added localStorage persistence for sidebar state.
- **2026-04-16**: Dashboard UI Phase 2 completion - Created Sidebar component with collapsible functionality, SidebarDrawer for mobile view, integrated with dashboard page, added localStorage persistence for sidebar collapsed state. Build verified successfully.
- **2026-04-16**: Bug fixes and sidebar improvements - Fixed toggle icon not changing between collapsed/expanded states, added colored left border accent to PinnedItem to match CollectionCard, made Collections section in sidebar collapsible with chevron animation, fixed sidebar not rendering after browser back navigation (removed mounted guard from sidebar render).
- **2026-04-16**: Dashboard UI Phase 3 completion - Implemented stats cards (total items, collections, favorites), recent collections section, pinned items section, and recent items section. Created DashboardShell and StatsCard components, RecentItem component. Updated mock data for development. Build verified and merged to main.
- **2026-04-17**: Neon PostgreSQL + Prisma Setup - Configured Prisma 7 with Neon serverless adapter, created initial migration with all data models, added seed script with system item types and demo data, added database test script. Build verified and merged to main.
- **2026-04-17**: Seed Data Population - Overwrote seed file with spec-compliant data, created demo user (demo@devstash.io), seeded all 7 system item types, created 5 collections (React Patterns, AI Workflows, DevOps, Terminal Commands, Design Resources), populated collections with realistic items. Build verified and merged to main.
- **2026-04-17**: Dashboard Collections - Created src/lib/db/collections.ts with data fetching functions, replaced mock collection data in dashboard with real Neon database queries via Prisma, collection card border color derived from most-used content type, type icons shown per collection, stats fetched from database. Fixed pre-existing seed.ts type error. Build verified.
- **2026-04-17**: Dashboard Items - Created src/lib/db/items.ts with getPinnedItems and getRecentItems functions, replaced mock pinned/recent item data in dashboard with real Neon database queries via Prisma. Updated PinnedItem and RecentItem components to receive type icon/color/name directly (removed mock-data dependency) and added type tag pill. Pinned section hides when empty. Build verified.
- **2026-04-17**: Stats & Sidebar - Added getSystemItemTypesWithCounts to src/lib/db/items.ts returning system item types in fixed order (snippet, prompt, command, note, file, image, link) with per-user counts. Rewired Sidebar to consume real DB data via props (itemTypes, collections) threaded through DashboardShell and SidebarDrawer; removed mockItemTypes/mockCollections usage. System type links point to /items/[name]s. Favorites keep the star icon; recents show a colored dot using the collection's dominant item-type color. Added "View all collections" link to /collections. Build verified.
- **2026-04-18**: Add Pro Badge to Sidebar - Installed ShadCN Badge component at src/components/ui/badge.tsx. Added PRO_TYPES set (file, image) in Sidebar.tsx and rendered a small outlined PRO badge between the item-type title and the count for those types; count pinned right via ml-auto, badge hidden when sidebar is collapsed. Covers mobile drawer automatically since SidebarDrawer wraps Sidebar. Build verified and merged to main.
- **2026-04-18**: Codebase Quick Wins Cleanup - Applied low-risk fixes from the code-scanner audit. Extracted shared iconMap to src/lib/icon-map.ts (removed duplicates from Sidebar, CollectionCard, PinnedItem, RecentItem). Dropped unnecessary 'use client' from PinnedItem and RecentItem. Added take: 20 bound to getRecentCollections. Guarded JSON.parse in DashboardShell against malformed localStorage. Removed unused mock exports (kept mockUser until auth lands). Dropped redundant @@index([email]) and @@index([name]) via Prisma migration drop_redundant_indexes. Added dashboard loading.tsx skeleton and error.tsx boundary. Build verified and merged to main.
