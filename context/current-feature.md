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

# Current Feature: Forgot Password

<!--Feature Name-->

## Status

<!--Not Started|In Progress|Completed-->

In Progress

## Goals

<!--Goals & requirements-->

- Add a "Forgot password?" link on the `/sign-in` page that navigates to a new `/forgot-password` route.
- Build `/forgot-password` page with an email input that posts to a new `POST /api/auth/forgot-password` endpoint.
- Generate a password reset token using the existing `VerificationToken` Prisma model (reusing the identifier/token/expires columns; no migration).
- Use a distinct identifier scheme (e.g. `pwreset:<email>`) so password reset tokens don't collide with email verification tokens that already live in the same table.
- Short TTL for reset tokens (e.g. 1 hour) — shorter than the 24h used for email verification.
- Send the reset email via the existing Resend client (`src/lib/email.ts`) with a branded template that links to `/reset-password?token=...`.
- Enumeration-safe: `POST /api/auth/forgot-password` always returns a uniform 200 response whether or not the email matches a user.
- Build `/reset-password` page that validates the token on the client/server, shows a new-password + confirm form, and posts to `POST /api/auth/reset-password`.
- `POST /api/auth/reset-password` consumes the token (single-use, delete-on-use), enforces the same 8-char minimum as register, hashes with bcryptjs (cost 10), updates `User.password`, and invalidates the token.
- After a successful reset, redirect the user to `/sign-in?reset=1` and show a success toast.
- Handle token error states (`expired`, `invalid`, `missing`) on `/reset-password` with clear messaging and a link back to `/forgot-password` to request a new one.

## Notes

<!--Any extra notes-->

- Reuse patterns from the email verification feature (2026-04-21): `src/lib/verification-token.ts` (`createVerificationToken` / `consumeVerificationToken` delete-on-use), `src/lib/email.ts` (Resend client + branded template), and the enumeration-safe uniform-200 pattern from `POST /api/auth/verify/resend`.
- The `VerificationToken` table is reused as-is — `identifier` namespacing (`pwreset:<email>` vs plain `<email>`) keeps password reset tokens separate from email verification tokens without a schema change.
- Consider whether `createVerificationToken` / `consumeVerificationToken` need a `purpose` parameter or a second set of helpers (e.g. `createPasswordResetToken`) so reset TTL (1h) can differ from verification TTL (24h) cleanly.
- Not gated by `EMAIL_VERIFICATION_ENABLED` — password reset must work regardless of the verification flag. If Resend is still in sandbox mode, test with the owner's own email.
- GitHub OAuth users don't have a password set, so the reset flow should still appear to succeed (enumeration safety) but no email is sent / no token issued for users without a `password` value.
- Relevant files to reference during implementation: `src/app/sign-in/page.tsx`, `src/components/auth/SignInForm.tsx`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/verify/resend/route.ts`, `src/lib/verification-token.ts`, `src/lib/email.ts`.



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
- **2026-04-19**: Auth Phase 1 - NextAuth + GitHub Provider - Installed next-auth@beta and @auth/prisma-adapter. Split config: src/auth.config.ts (edge-safe GitHub provider + jwt/session callbacks populating user.id) and src/auth.ts (PrismaAdapter + session strategy 'jwt'). Added /api/auth/[...nextauth] route handler re-exporting handlers.GET/POST. Created src/proxy.ts exporting `proxy = auth(...)` that redirects unauthenticated visitors to `/dashboard/*` to `/api/auth/signin?callbackUrl=...`. Extended Session.user with id via src/types/next-auth.d.ts. Build verified; /dashboard redirect confirmed via curl; default NextAuth sign-in page renders with GitHub button. Merged to main.
- **2026-04-20**: Auth Phase 2 - Credentials (Email/Password) Provider - Added Credentials provider alongside GitHub using the split-config pattern: src/auth.config.ts declares a Credentials placeholder with `authorize: () => null` (edge-safe); src/auth.ts filters the placeholder by provider id and re-registers Credentials with a bcryptjs-backed authorize that looks up the user via Prisma and compares against the hashed password. Added POST /api/auth/register route that validates name/email/password/confirmPassword, rejects duplicate emails (409), enforces min 8-char passwords, hashes with bcryptjs (cost 10), and returns {success, user}. No migration needed — password column already exists from the earlier add_user_password migration. Verified via curl: register happy-path (201), duplicate (409), mismatched pw (400), short pw (400); credentials signin sets session cookie and /dashboard returns 200; wrong password redirects to /signin?error=CredentialsSignin with null session; GitHub provider still listed at /api/auth/providers; unauth /dashboard still redirects. Build verified and merged to main.
- **2026-04-20**: Auth Phase 3 - Custom Sign-in / Register UI + Sidebar User - Added `pages: { signIn: "/sign-in" }` to src/auth.config.ts and updated src/proxy.ts to redirect unauthenticated `/dashboard/*` visitors to `/sign-in?callbackUrl=...`. Built custom `/sign-in` (credentials form + GitHub button via `signIn()`, honors `callbackUrl`, redirects signed-in users) and `/register` (name/email/password/confirm with client-side validation; posts to `/api/auth/register`; redirects to `/sign-in?registered=1`). Added `/profile` placeholder gated by `auth()`. Created reusable `UserAvatar` (image-or-initials fallback, cap 2 chars, `?` when empty) and `SidebarUser` client component with click-outside/Escape-close dropup containing a `signOut({ callbackUrl: "/sign-in" })` action; avatar wrapped in a Link to `/profile`. Threaded session data from `auth()` through DashboardShell → Sidebar / SidebarDrawer props; deleted src/lib/mock-data.ts. Added inline `GithubIcon` (lucide-react has no `Github` export in this version). Installed `sonner`, mounted `<Toaster>` in root layout, and fire a deduped success toast on `/sign-in` when `?registered=1` is present (then scrub the param from the URL). Kept `next.config.ts` `devIndicators: false`. Verified in-browser: sign-out clears session and lands on /sign-in; avatar → /profile works; register → /sign-in with toast → new user signs in and sees "P3" initials in sidebar. Build verified and merged to main.
- **2026-04-21**: Email Verification on Register (Resend) - Installed `resend` and built verification on top of the existing `VerificationToken` table (24h TTL; no migration). Added src/lib/email.ts (Resend client + branded HTML/text template; from-address and app URL driven by EMAIL_FROM / APP_URL / NEXT_PUBLIC_APP_URL / AUTH_URL) and src/lib/verification-token.ts (createVerificationToken replaces prior rows for the identifier via deleteMany then inserts a fresh 32-byte hex token; consumeVerificationToken returns `{ok,email}` or `{ok:false, reason:"not-found"|"expired"}` and always deletes the row). POST /api/auth/register now issues a token and sends the email after user creation inside a try/catch so send failures are logged but non-fatal. Added GET /api/auth/verify (consumes token, sets `User.emailVerified`, redirects to `/sign-in?verified=1` or `/sign-in?verify=expired|invalid|missing`) and POST /api/auth/verify/resend (uniform 200 response to avoid email enumeration; only actually sends if a matching unverified user exists). src/auth.ts adds an `EmailNotVerifiedError extends CredentialsSignin` (code `"EmailNotVerified"`) thrown in `authorize` when the password is valid but `emailVerified` is null; GitHub OAuth users are unaffected. SignInForm handles `res.code === "EmailNotVerified"` by showing a "Resend verification email" button; updated toasts for `?registered=1` (new copy prompts verification), `?verified=1`, and `?verify=expired|invalid|missing`. Also added scripts/cleanup-users.ts — deletes every user except demo@devstash.io (relying on User cascade for accounts/sessions/items/collections/custom itemTypes) plus stale VerificationToken rows, with a production-URL guard and interactive `yes` confirmation (skippable via `--yes`). Build verified and merged to main.
- **2026-04-21**: Toggle Email Verification Flag - Added a runtime kill-switch for the Resend verification flow, prompted by Resend sandbox mode only delivering to the account owner's own address. New `src/lib/features.ts` exports `isEmailVerificationEnabled()` which returns true only when `EMAIL_VERIFICATION_ENABLED` is `"true"`/`"1"` (case-insensitive, trimmed); any other value — including unset — disables verification. POST /api/auth/register now branches on the flag: when off, the user is created with `emailVerified: new Date()` and no token is issued / email sent; when on, behavior is identical to the prior feature. src/auth.ts gates the `EmailNotVerifiedError` throw behind the same flag so credentials sign-in succeeds for unverified users when off; GitHub OAuth is untouched. POST /api/auth/verify/resend short-circuits with a uniform 200 when off (preserves the enumeration-safe contract, skips the DB hit); GET /api/auth/verify is left functional so legacy tokens issued before the flip can still be consumed harmlessly. `/sign-in/page.tsx` now reads the flag server-side and threads it into `SignInForm` as `emailVerificationEnabled`; the `?registered=1` toast copy switches to "Account created — you can now sign in." when off so we don't promise an email that's not coming. The resend CTA remains naturally gated (only fires on `EmailNotVerified`, which can't happen when off). `.env.example` documents the new var with a "false" default (gitignored in this repo, so the file is edited locally only). Build verified and merged to main.
