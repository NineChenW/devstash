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
Neon PostgreSQL + Prisma Setup

## Status

<!--Not Started|In Progress|Completed-->

In Progress

## Goals

<!--Goals & requirements-->
- Set up Prisma 7 ORM with Neon PostgreSQL (serverless)
- Create initial Prisma schema based on data models from project-overview.md
- Include all NextAuth required models (Account, Session, VerificationToken)
- Add appropriate database indexes and cascade deletes
- Create development and production database branches in Neon
- Use migrations workflow (prisma migrate dev, never db push)
- Verify Prisma 7 breaking changes and apply necessary updates

## Notes

<!--Any extra notes-->
- References: @context/features/database-spec.md, @context/project-overview.md
- Prisma 7 has breaking changes - read entire upgrade guide: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7
- Setup guide: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres
- Dev workflow: Always create migrations with `prisma migrate dev`, never push directly
- Database strategy: Separate dev and production branches in Neon

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
