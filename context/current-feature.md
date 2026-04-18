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

Codebase Quick Wins Cleanup

## Status

<!--Not Started|In Progress|Completed-->

In Progress

## Goals

<!--Goals & requirements-->

Apply low-risk fixes surfaced by the code-scanner audit. Auth-related fixes are explicitly out of scope.

1. Extract the duplicated `iconMap` from `Sidebar.tsx`, `CollectionCard.tsx`, `PinnedItem.tsx`, and `RecentItem.tsx` into a single shared module at `src/lib/icon-map.ts` and import it in all four components.
2. Remove the unnecessary `'use client'` directive from `src/components/items/PinnedItem.tsx` and `src/components/items/RecentItem.tsx` (neither uses hooks or browser APIs).
3. Add a `take: 20` limit to the `prisma.collection.findMany` call in `getRecentCollections` in `src/lib/db/collections.ts` so it is not unbounded.
4. Wrap the `JSON.parse(saved)` call in `src/components/dashboard/DashboardShell.tsx` with a try/catch so a malformed localStorage value cannot crash the component.
5. Delete unused mock exports from `src/lib/mock-data.ts` (`mockItems`, `mockCollections`, `mockItemCollections`, `mockStats`, `mockPinnedItems`) once no longer referenced. **Keep `mockUser` and its import in `src/components/sidebar/Sidebar.tsx` in place** — it will be removed later when Authentication is implemented.
6. Remove the redundant `@@index([email])` from the `User` model and `@@index([name])` from the `Tag` model in `prisma/schema.prisma` (both columns are already `@unique`). A proper Prisma migration is **required** here — this change must flow through `prisma/migrations/` so the dev and production branches stay in sync. Run `prisma migrate dev --name drop_redundant_indexes` to auto-generate the migration file, commit the generated migration alongside the schema change, and run `prisma migrate deploy` on production. Do not hand-write raw SQL, do not use `db push`, and do not apply the change to the database without a committed migration file.
7. Add `src/app/dashboard/loading.tsx` with a skeleton layout and `src/app/dashboard/error.tsx` as an error boundary for the dashboard route.

## Notes

<!--Any extra notes-->

- Source: code-scanner audit run on 2026-04-18. Findings selected: #4, #5, #6, #8, #10, #11, #12, #13.
- Explicitly excluded from this feature: finding #1 (auth guard — auth is not yet implemented), findings #2 and #3 (Tailwind v4 `@theme` migration — higher risk of visual regression, should be its own feature), finding #7 (removing `mockUser` — kept for testing until Authentication is implemented), finding #9 (inline styles — justified for DB-driven colors, needs standards discussion first).
- No raw SQL. All database changes must go through Prisma migrations: edit `prisma/schema.prisma`, run `prisma migrate dev` to generate the migration, commit the generated migration file under `prisma/migrations/`, and deploy with `prisma migrate deploy`. Migrations are how dev and production branches stay in sync — skipping the migration file (via `db push` or manual SQL) will drift the two environments. Never hand-edit the generated SQL and never use `db push`.
- Run `npm run build` after each group of changes. Verify the dashboard still renders correctly in the browser, including the sidebar user area, collection cards, pinned items, and recent items.


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
