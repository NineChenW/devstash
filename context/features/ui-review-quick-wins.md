# UI Review Quick Wins

## Overview

Batch of low-risk UI fixes surfaced by the 2026-05-14 UI review. Mix of a11y, responsive polish, and a Tailwind v4 `@theme` wiring fix that resolves a visible mobile-drawer bug.

Out of scope: the `/favorites` 500 error (needs query-level investigation, separate piece of work) and the architectural note on `<main>` being the scroll container.

## Requirements

### Tier 1 — trivial (one-liners)

1. **Sidebar toggle aria-labels.** [DashboardShell.tsx:73,83](src/components/dashboard/DashboardShell.tsx#L73): mobile menu button → `aria-label="Open menu"`; desktop sidebar toggle → `aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}`.

2. **Collapsed-sidebar link aria-labels.** [Sidebar.tsx](src/components/sidebar/Sidebar.tsx): item type `<Link>`s and collection `<Link>`s in collapsed mode add `aria-label={name}` alongside the existing `title` so screen readers get a reliable announcement.

3. **Sign-in visible on mobile homepage.** [HomeNav.tsx:54](src/components/home/HomeNav.tsx#L54): remove `hidden sm:inline-flex` from the Sign-in button OR add a Sign-in link to the footer's Company column. Pick whichever is least visually disruptive.

4. **`title={item.title}` on truncated cards.** [ItemCard.tsx](src/components/items/ItemCard.tsx) and [ImageThumbnailCard.tsx](src/components/items/ImageThumbnailCard.tsx): add `title={title}` to the `truncate` element so the full text surfaces on hover.

5. **`spellCheck={false}` on item title input.** [ItemFormFields.tsx](src/components/items/ItemFormFields.tsx) — title `<Input>` only. Monaco is unaffected by the React `spellCheck` prop (runs inside a contentEditable that ignores it), so no editor-body changes needed.

6. **Print + reduced-motion fallback for FadeOnScroll.** [globals.css](src/app/globals.css) inside `@layer components`:
   ```css
   @media (prefers-reduced-motion: reduce), print {
     [data-fade-on-scroll] { opacity: 1 !important; transform: none !important; }
   }
   ```
   Add `data-fade-on-scroll` attribute to the wrapper in [FadeOnScroll.tsx](src/components/home/FadeOnScroll.tsx).

7. **Tags in command palette keywords.** [CommandPalette.tsx](src/components/search/CommandPalette.tsx) — include `item.tags?.join(' ')` in the `keywords` array. Requires extending the `SearchItem` shape in [src/lib/db/search.ts](src/lib/db/search.ts) to select `tags: { select: { name: true } }` and map into the result.

8. **Tailwind v4 `@theme inline` block.** [globals.css](src/app/globals.css): add an `@theme inline` block that maps the existing HSL CSS variables to Tailwind v4 color utilities — `--color-background`, `--color-card`, `--color-popover`, `--color-muted`, `--color-accent`, `--color-border`, `--color-input`, `--color-ring`, `--color-primary`, `--color-secondary`, `--color-destructive`, and their `-foreground` pairs. This fixes the transparent-surface bug (visible on the mobile sidebar drawer and historically worked around with `bg-[hsl(217.2_32.6%_12%)]` literals in Modal/Dialog/Sheet). Hardcoded overrides stay valid after this lands — do not rewrite them in this pass.

### Tier 2 — small but more than one line

9. **AI section code block fade affordance on phone.** [AISection.tsx:75](src/components/home/AISection.tsx#L75) — keep `overflow-x-auto`, add a right-edge mask gradient below `sm:` so users see the horizontal-scroll affordance:
   ```tsx
   className="... [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] sm:[mask-image:none]"
   ```

10. **Editor preferences toggle off-state visible border.** [EditorPreferencesForm.tsx](src/components/settings/EditorPreferencesForm.tsx): off-state track gets `border border-white/15` so the silhouette reads even before #8 lands and as a contrast boost after.

11. **CollectionCard truncation tooltip.** [CollectionCard.tsx](src/components/collections/CollectionCard.tsx): `title={name}` on the truncated `<h3>`, mirrors #4.

12. **Focus ring on sidebar Favorites row.** [Sidebar.tsx](src/components/sidebar/Sidebar.tsx) — sidebar Favorites Link adds `focus-visible:ring-2 focus-visible:ring-ring` to match the other nav rows.

13. **Mobile hero dashboard mock simplification.** [Hero.tsx](src/components/home/Hero.tsx) — at `<sm:` (≤640px) either drop the dashboard mock grid to 1 column or hide the truncated titles entirely (icon + type pill only). Pick the less-noisy option. Goal: reduce the "useDe..., docke..., Tailwi..., desig..." visual noise on phones.

14. **Quick-copy icon on dashboard Pinned / Recent items.** [getPinnedItems](src/lib/db/items.ts) and [getRecentItems](src/lib/db/items.ts): extend the returned `DashboardItem` shape with `content: string | null` and `url: string | null` (already on the table, just not selected). Add `<CopyButton text={item.content ?? item.url ?? ''} />` to [PinnedItem.tsx](src/components/items/PinnedItem.tsx) and [RecentItem.tsx](src/components/items/RecentItem.tsx). Mirrors the existing pattern from `ItemCard`.

15. **Settings / Sign-out reachable when sidebar collapsed.** [SidebarUser.tsx](src/components/sidebar/SidebarUser.tsx) — when `collapsed`, swap the avatar's plain `<Link href="/profile">` for a `<button>` that opens the existing dropdown (Profile / Settings / Sign out). When not collapsed, keep current behavior (avatar links to `/profile`, separate dots-menu opens dropdown).

16. **Sticky-nav covering footer logo on phone.** [Footer.tsx](src/components/home/Footer.tsx) — change top padding from `pt-10` to `pt-16` on mobile only (or add `scroll-mt-16`). Cosmetic.

## Notes

- Reference: full UI review with severity grouping was generated in-session and is preserved in conversation context (not committed to disk).
- Suggested ship order: **#8 first** (biggest visible impact, fixes a mobile bug). Then batch #1, #2, #3, #4, #5, #11 as one commit. Then #7, #14 together (shared DB shape extension). Then #6, #9, #13, #16 (homepage polish). Then #10, #12, #15 as time permits.
- After #8 lands, hardcoded `bg-[hsl(217.2_32.6%_12%)]` overrides in [Modal](src/components/ui/modal.tsx) / [Dialog](src/components/ui/dialog.tsx) / [Sheet](src/components/ui/sheet.tsx) / [CreateItemDialog](src/components/items/CreateItemDialog.tsx) / [CreateCollectionDialog](src/components/collections/CreateCollectionDialog.tsx) / [EditCollectionDialog](src/components/collections/EditCollectionDialog.tsx) will still work but become redundant. Do **not** rewrite them in this pass — defer to whenever someone is touching those files for another reason.
- No new server actions or pure utility functions expected. Vitest coverage: only if a parseable helper emerges (none anticipated). Existing 13-files / 168-tests suite should stay green.
- Critical issue **NOT** in this spec: `/favorites` returns 500 with `[object ErrorEvent]`. That needs a separate piece of work targeting the Neon adapter / query plan.
