# Update Rules

!!! Read this before update. !!!
Do not violate any following rules:

1. Please keep all the comments stay the same.
2. Do not delete the existing history records.
3. Only add a new history record at the end of this file after a feature is stetted completed.
4. Fill the current feature area with the current active feature title.
5. Update status to "In Progress" when starting a new feature.
6. Update status to "Completed" when finishing a feature.
7. Update goals section with current feature requirements.
8. Update notes section with current feature references.

# Current Feature

<!--Feature Name-->
AI Explain Code

## Status

<!--Not Started|In Progress|Completed-->
In Progress

## Goals

<!--Goals & requirements-->
- Create an `explainCode` server action with auth, Pro gating, Zod validation, rate limiting
- Add "Explain" button (Sparkles icon) to code editor window controls header (next to Copy button)
- Only show for snippet and command types in the item drawer (not in create/edit forms)
- After generating, show Code/Explain tabs in the editor header to toggle between views
- Render explanation as markdown in the same container space as the code editor
- Explanation should be concise (~200-300 words) covering what the code does and key concepts
- Loading state: Loader2 spinner while generating
- Pro gating in UI: show Crown icon + tooltip ("AI features require Pro subscription") for free users
- Error handling via toast (Pro gating, rate limit, AI service errors)
- Follow existing patterns
- Unit tests for server action

## Notes

<!--Any extra notes-->
- Explanations are not saved to the database — regenerated on each click
- Not available in create/edit forms, only in the item drawer read view
- `isPro` needs to be passed as a prop to the item drawer / code editor
- See `docs/ai-integration-plan.md` for full architectural context

## History

<!--
Keep this updated.
Earliest to latest.
-->

## History

<!--
Keep this updated.
Earliest to latest.
-->

- **2026-04-14**: Initial Next.js and Tailwind CSS v4 setup
- **2026-04-15**: Dashboard UI Phase 1 implementation
- **2026-04-16**: Dashboard UI Phase 2 implementation
- **2026-04-16**: Dashboard UI Phase 2 completion
- **2026-04-16**: Bug fixes and sidebar improvements
- **2026-04-16**: Dashboard UI Phase 3 completion
- **2026-04-17**: Neon PostgreSQL + Prisma Setup
- **2026-04-17**: Seed Data Population
- **2026-04-17**: Dashboard Collections
- **2026-04-17**: Dashboard Items
- **2026-04-17**: Stats & Sidebar
- **2026-04-18**: Add Pro Badge to Sidebar
- **2026-04-18**: Codebase Quick Wins Cleanup
- **2026-04-19**: Auth Phase 1 - NextAuth + GitHub Provider
- **2026-04-20**: Auth Phase 2 - Credentials (Email/Password) Provider
- **2026-04-20**: Auth Phase 3 - Custom Sign-in / Register UI + Sidebar User
- **2026-04-21**: Email Verification on Register (Resend)
- **2026-04-21**: Toggle Email Verification Flag
- **2026-04-21**: Forgot Password
- **2026-04-22**: Profile Page
- **2026-04-25**: Rate Limiting for Auth
- **2026-04-25**: Fix GitHub OAuth Redirect
- **2026-04-26**: Items List View
- **2026-04-27**: Vitest Setup
- **2026-04-28**: Items List 3-Column Grid
- **2026-04-30**: Item Drawer (View + Inline Edit)
- **2026-04-30**: Delete Item (Drawer + Confirmation)
- **2026-05-01**: Item Create (Dialog + Type-Conditional Fields)
- **2026-05-01**: Code Editor (Monaco) for Snippet + Command
- **2026-05-01**: Type-Specific Add Button on Items List
- **2026-05-02**: Markdown Editor for Note + Prompt
- **2026-05-04**: File Upload with Cloudflare R2
- **2026-05-04**: Image Gallery View
- **2026-05-04**: File List View
- **2026-05-05**: Quick Copy Icon on Item Cards
- **2026-05-06**: Codebase Audit Quick Wins
- **2026-05-07**: Items UI Refactor — Reduce Duplication
- **2026-05-07**: Collection Create (Top-Bar Dialog)
- **2026-05-08**: Add Item to Collections (Multi-Select on Create + Edit)
- **2026-05-08**: Sidebar Logo → Dashboard Link
- **2026-05-08**: Collections Pages (/collections + /collections/[id])
- **2026-05-08**: Collection Edit / Delete / Favorite Actions
- **2026-05-09**: Global Search / Command Palette
- **2026-05-09**: Command Palette Search Fix (Substring Matching)
- **2026-05-09**: Pagination
- **2026-05-10**: Settings Page
- **2026-05-10**: Editor Preferences Settings
- **2026-05-11**: Favorites Page
- **2026-05-12**: Favorite Toggle (Drawer, Collection Page, Cards)
- **2026-05-12**: Favorites Page Sorting (Client-Side)
- **2026-05-12**: Pinned Items (Drawer Toggle)
- **2026-05-13**: Homepage
- **2026-05-13**: Top Bar Responsive Cleanup
- **2026-05-14**: UI Review Quick Wins
- **2026-05-14**: Homepage Top Nav on Auth Pages
- **2026-05-14**: Stripe Integration — Phase 1 (Core Infrastructure)
- **2026-05-15**: Stripe Integration — Phase 2 (Integration & UI)
- **2026-05-16**: AI Auto-Tagging
- **2026-05-16**: AI Description Suggestion
