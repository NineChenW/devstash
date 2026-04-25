# Auth Security Review

**Last audited:** 2026-04-22
**Scope:** NextAuth v5 configuration, credentials provider, email verification, password reset, profile page, account deletion, related API routes.

## Summary
- Files audited: 21
- Findings: 0 Critical / 1 High / 3 Medium / 2 Low
- Overall posture: Solid core — strong bcrypt cost, high-entropy tokens, single-use enforcement with `pwreset:` namespace isolation, session-gated mutations. One open-redirect vector on the sign-in page is the only non-trivial issue; the rest are hardening opportunities (rate limiting, feature-flag-aware messaging, post-password-change session invalidation).

## Critical
_No findings at this severity._

## High
### 1. Open redirect via `callbackUrl` on sign-in page (already-authenticated branch and post-credentials redirect)
- **File:** `src/app/sign-in/page.tsx:10-15`, `src/app/sign-in/SignInForm.tsx:19,91`
- **Dimension:** Session gating / callbackUrl handling
- **Issue:** Both entry points forward an unvalidated `callbackUrl` query param into a Next.js navigation primitive:
  - `src/app/sign-in/page.tsx:14` calls `redirect(callbackUrl || '/dashboard')` for users who are already signed in. Next.js's `redirect()` accepts absolute URLs and navigates to them (see authoritative Next.js docs: `redirect` "can be used to redirect to external links").
  - `src/app/sign-in/SignInForm.tsx:91` calls `router.push(callbackUrl)` after a successful credentials sign-in. `router.push` in the App Router performs a full-page navigation when given an absolute URL.
  Neither path validates that `callbackUrl` is a relative, same-origin path. A crafted link like `/sign-in?callbackUrl=https://evil.example/login` will bounce an authenticated (or just-authenticated) user to the attacker's domain. Protocol-relative values such as `//evil.example/path` are also unhandled.
  Note: the other two `callbackUrl` consumers in this codebase — `signIn('github', { callbackUrl })` (SignInForm:133) and `signOut({ callbackUrl: '/sign-in' })` (SidebarUser / DeleteAccountDialog) — go through NextAuth's default `redirect` callback, which rejects cross-origin URLs. Those are safe. This finding is specifically about the two Next.js-native navigations.
- **Impact:** Phishing assist / credential-harvesting chain. An attacker can send a DevStash sign-in link that looks legitimate, wait for the user to authenticate, and silently land them on a lookalike page under the attacker's control (useful for re-prompting for a password or Pro billing info).
- **Suggested Fix:** Normalize `callbackUrl` to a safe same-origin path before passing it to `redirect()` / `router.push()`. A minimal helper:

  ```ts
  // src/lib/safe-redirect.ts
  export function safeCallbackUrl(raw: string | null | undefined, fallback = '/dashboard') {
    if (!raw) return fallback
    // Must be a single-slash relative path, not protocol-relative ("//evil")
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw
    return fallback
  }
  ```
  Then in `sign-in/page.tsx`: `redirect(safeCallbackUrl(callbackUrl))`, and in `SignInForm.tsx`: use `safeCallbackUrl(searchParams.get('callbackUrl'))` when computing `callbackUrl`. Apply the same helper to the GitHub `signIn()` call for defense in depth (NextAuth's default validator handles it, but passing only vetted input removes the dependency).

## Medium
### 1. No rate limiting on credentials sign-in, register, forgot-password, or resend-verification
- **File:** `src/app/api/auth/register/route.ts:15`, `src/app/api/auth/forgot-password/route.ts:8`, `src/app/api/auth/verify/resend/route.ts:9`, credentials `authorize` in `src/auth.ts:27-44`
- **Dimension:** Rate limiting & enumeration
- **Issue:** All credential-bearing auth endpoints accept unlimited requests per IP/email. `authorize()` performs a bcrypt compare on every attempt, so sustained guessing is both an account-guessing vector (with the 8-char minimum, simple passwords like `password` / `devstash1` are plausible) and a CPU-exhaustion vector. `forgot-password` and `resend-verification` can be used to flood the Resend quota or an individual user's inbox. Not verified whether rate limiting exists at the platform layer (Vercel / Cloudflare).
- **Impact:** Credential stuffing, online password guessing, email-bombing a known user, Resend quota exhaustion.
- **Suggested Fix:** Add a lightweight rate limiter keyed on `(route, ip)` and, where applicable, `(route, email)`. Upstash Redis + a small helper works well with the serverless deployment model. Typical budgets: sign-in 10/min per IP, 5/min per email; register 5/min per IP; forgot-password 3/hour per email; resend-verification 3/hour per email. Returning uniform 200 on forgot/resend must be preserved even when rate-limited (either fake-200 or 429 with generic copy — prefer the former to keep the enumeration contract intact).

### 2. Feature-flag-aware copy drifts on verify-error toasts when `EMAIL_VERIFICATION_ENABLED` is off
- **File:** `src/app/sign-in/SignInForm.tsx:39-47`
- **Dimension:** Feature flags
- **Issue:** When the flag is disabled, legacy verification links hitting `GET /api/auth/verify` still redirect to `/sign-in?verify=invalid|expired|missing` (deliberately, so old tokens can still be consumed harmlessly — documented). However, SignInForm renders toasts like "That verification link has expired. Request a new one below." when the flag is off, yet the resend button only appears after a failed credentials sign-in with `code === "EmailNotVerified"`, which can never fire when the flag is off (`src/auth.ts:38`). The UX invites the user to do something they cannot do.
- **Impact:** Confusing end-user experience; not an auth bypass, but a feature-flag inconsistency the agent brief explicitly calls out.
- **Suggested Fix:** Gate the `verifyError` toast branch on `emailVerificationEnabled`. When the flag is off, either drop the toast entirely or show a neutral "Sign in with your password." message. Example:

  ```ts
  } else if (verifyError && emailVerificationEnabled) {
    // existing expired/invalid/missing toast branches
  }
  ```

### 3. `change-password` does not force other sessions to re-authenticate
- **File:** `src/app/api/auth/change-password/route.ts:58-64`
- **Dimension:** Profile / account mutations
- **Issue:** On successful password change only `User.password` is updated. Because the session strategy is `jwt` (`src/auth.ts:15`), every previously issued JWT remains valid until its own `maxAge` expires. If an attacker already has an active session cookie (e.g., stolen via XSS in a separate feature, session fixation on a shared machine), the owner changing their password does not evict the attacker. There is no `passwordChangedAt` column or JWT `iat` check that would enable that.
- **Impact:** Reduced containment on a known compromise. The user's expectation when changing a password is typically "other devices are signed out."
- **Suggested Fix:** Add a `passwordChangedAt DateTime?` column (migration, not `db push`) updated alongside the password hash. Stamp `token.pwdAt` in the `jwt` callback from the DB and reject the session in the `session` callback when `token.pwdAt` is older than `user.passwordChangedAt`. Alternatively, if moving to the database session strategy is acceptable later, `prisma.session.deleteMany({ where: { userId } })` would achieve the same on DB sessions.

## Low
### 1. `DELETE /api/account` does not require re-authentication
- **File:** `src/app/api/account/route.ts:5-18`
- **Dimension:** Profile / account mutations
- **Issue:** The endpoint is correctly session-gated and the `DELETE` user-row cascades wipe items, collections, sessions, accounts, and custom itemTypes (confirmed from `prisma/schema.prisma:33-149`). The UI adds a typed `DELETE` confirmation (`src/components/profile/DeleteAccountDialog.tsx:10,86`). What's missing is a destructive-action step-up: a stolen/borrowed active session (e.g., a forgotten logout on a shared machine) can wipe the account with no password re-prompt. For OAuth-only accounts re-prompting a password is not possible, but requiring typing the email address (server-side check) or requiring a recent login would be reasonable.
- **Impact:** Increased blast radius for session theft or casual opportunistic attack on an unlocked device.
- **Suggested Fix:** For accounts with `user.password`, require a `currentPassword` body field and `bcrypt.compare` before deleting. For OAuth-only accounts, accept `confirmEmail` and compare against `session.user.email`. The typed-`DELETE` string check is client-only today — a direct `curl -X DELETE -b cookie` bypasses it.

### 2. Register endpoint returns 409 on duplicate email (accepted per spec, noted for completeness)
- **File:** `src/app/api/auth/register/route.ts:46-49`
- **Dimension:** Rate limiting & enumeration
- **Issue:** `POST /api/auth/register` returns `{error: "Email is already registered"}` with status `409` when the email already exists. This is a deliberate trade-off documented in the agent brief ("register (non-uniform, 409 on duplicate is accepted here)"). Recording it so future auditors don't re-flag it.
- **Impact:** Email enumeration via the register endpoint (known / accepted).
- **Suggested Fix:** None required by spec. If enumeration tolerance changes, switch to a uniform 200 + out-of-band "we sent a verification email" response (even when the email is already registered) and deliver a "you already have an account" email via Resend.

## Passed Checks
Security properties verified during this audit:
- [x] Passwords hashed with `bcryptjs` at cost 10 in all three write paths: `src/app/api/auth/register/route.ts:51`, `src/app/api/auth/reset-password/route.ts:58`, `src/app/api/auth/change-password/route.ts:58`.
- [x] `bcrypt.compare` used for all password verifications (`src/auth.ts:35`, `src/app/api/auth/change-password/route.ts:53`) — constant-time via bcryptjs.
- [x] Plaintext passwords never logged; no `console.*` call in the auth surface captures the password field (verified via repo-wide grep; logs in `register`, `forgot-password`, `verify/resend`, `account` only log `err` messages from Resend/Prisma).
- [x] Plaintext passwords never returned in API responses — `register` selects only `{id, name, email}` (`src/app/api/auth/register/route.ts:60`); other routes return only `{success}` or `{error}`.
- [x] Register / reset-password / change-password all enforce `password.length >= 8` and `password === confirmPassword` server-side, regardless of client validation (`register:35-44`, `reset-password:30-38`, `change-password:35-43`).
- [x] Verification tokens generated with `crypto.randomBytes(32).toString("hex")` — 256 bits of entropy (`src/lib/verification-token.ts:9`).
- [x] Password reset tokens use the same 32-byte entropy source (`src/lib/verification-token.ts:39`).
- [x] Verification TTL 24h, reset TTL 1h — reset is shorter as recommended (`src/lib/verification-token.ts:4-5`).
- [x] `consumeVerificationToken` always deletes the row on success or expiry (`src/lib/verification-token.ts:30,34`) — single-use enforced.
- [x] `consumePasswordResetToken` always deletes the row on success or expiry (`src/lib/verification-token.ts:67,71`) — single-use enforced.
- [x] Cross-use protection: `consumeVerificationToken` explicitly rejects rows whose identifier starts with `pwreset:` (`src/lib/verification-token.ts:27`), so reset tokens cannot be consumed by the verify endpoint. `checkPasswordResetToken` / `consumePasswordResetToken` reject rows missing the prefix (`:53`, `:62`).
- [x] `createVerificationToken` and `createPasswordResetToken` both `deleteMany` prior rows for the identifier before inserting (`:12`, `:43`) — prevents token reuse / stacking.
- [x] `POST /api/auth/forgot-password` is enumeration-safe: uniform `{success: true, 200}` regardless of whether the email exists or has a password (`src/app/api/auth/forgot-password/route.ts:31`). GitHub-only users (no `user.password`) get no token / no email (`:22`).
- [x] `POST /api/auth/verify/resend` is enumeration-safe: uniform 200 regardless of match, and short-circuits to 200 when feature flag is off before any DB lookup (`src/app/api/auth/verify/resend/route.ts:22-36`).
- [x] `POST /api/auth/reset-password` never updates the password without consuming the token first and verifying it belongs to an existing user (`src/app/api/auth/reset-password/route.ts:40-56`).
- [x] `POST /api/auth/reset-password` is NOT gated by `EMAIL_VERIFICATION_ENABLED` — reset continues to work when the flag is off, as designed.
- [x] Credentials `authorize()` returns `null` on both "no user" and "wrong password" (`src/auth.ts:33,36`) — no enumeration via differential response codes or error subclasses on this path.
- [x] `EmailNotVerifiedError extends CredentialsSignin` with `code = "EmailNotVerified"` (`src/auth.ts:9-11`) — consumed cleanly by `SignInForm` via `res.code === "EmailNotVerified"` (`src/app/sign-in/SignInForm.tsx:83`); no raw error leakage.
- [x] `EmailNotVerifiedError` is only thrown after `bcrypt.compare` returns true (`src/auth.ts:35-39`) — an attacker cannot probe verified-status for arbitrary emails.
- [x] `EmailNotVerifiedError` is gated by `isEmailVerificationEnabled()` (`src/auth.ts:38`) — flag-off users with `emailVerified: null` can still sign in.
- [x] Register sets `emailVerified: new Date()` when flag is off (`src/app/api/auth/register/route.ts:58`) — no bypass that leaves a user in an unverified state the system can't handle.
- [x] `isEmailVerificationEnabled()` consistently reads `EMAIL_VERIFICATION_ENABLED` (`true`/`1` case-insensitive, trimmed; `src/lib/features.ts:1-6`) and is used in all four touchpoints: register, authorize, resend, sign-in page (props). Verified via repo-wide grep.
- [x] `/api/auth/change-password` is session-gated via `auth()` (`src/app/api/auth/change-password/route.ts:13-16`) and uses `session.user.id` for the update — the caller cannot target a different user (`:45,59`).
- [x] `/api/auth/change-password` correctly handles OAuth-only accounts with `!user?.password` → 400 rather than creating a password or letting through (`:46-51`).
- [x] `/api/account` DELETE is session-gated (`src/app/api/account/route.ts:7`) and only deletes `session.user.id` — no body input that could target another user (`:12`).
- [x] Prisma schema confirms `onDelete: Cascade` from User → Account, Session, Item, Collection, ItemType (`prisma/schema.prisma:51,74,92,134,146`) — account delete leaves no orphaned rows.
- [x] `/profile` is gated inline via `auth()` and redirects to `/sign-in?callbackUrl=/profile` when unauthenticated (`src/app/profile/page.tsx:13-16`) — correctly compensates for `proxy.ts` only matching `/dashboard/*`.
- [x] `proxy.ts` builds the sign-in redirect URL using `req.nextUrl.pathname` only (`src/proxy.ts:12`) — user-controlled query string on a `/dashboard` URL cannot propagate into the callback.
- [x] `signIn("github", { callbackUrl })` and `signOut({ callbackUrl })` rely on NextAuth v5's default `redirect` callback, which only allows same-origin URLs (verified via authjs.dev docs) — no custom `redirect` callback override in `auth.config.ts` that would weaken this.
- [x] Email templates properly `encodeURIComponent(token)` in both `sendVerificationEmail` and `sendPasswordResetEmail` (`src/lib/email.ts:27,56`) — no injection via token value.
- [x] PrismaAdapter wired at the full-config layer (`src/auth.ts:14`), not in the edge-safe `auth.config.ts` — avoids running Prisma in the edge runtime.
- [x] Session strategy explicitly set to `"jwt"` (`src/auth.ts:15`), consistent with the in-memory credentials authorize pattern.
- [x] Register normalizes email via `.trim().toLowerCase()` (`src/app/api/auth/register/route.ts:24`); forgot-password, verify-resend, and `authorize` lookups are all lowercase (`forgot-password:16`, `verify/resend:17`, `auth.ts:32` — caller normalization via the sign-in form passing whatever the user typed is a minor non-issue since the DB has a unique lowercase email from register).
- [x] `checkPasswordResetToken` is read-only — rendering the reset-password page does not burn the token (`src/lib/verification-token.ts:51-58`), so refreshing the form doesn't invalidate the link.
- [x] Reset-password page redirects authenticated users away (`src/app/reset-password/page.tsx:12-15`) — avoids using a reset link while logged in as a different account.
- [x] No plaintext credentials are stored anywhere (schema has `password String?` only; no `pin`, `secret`, or similar cleartext field).

## Notes
- NextAuth v5 built-ins intentionally not flagged: CSRF on `/api/auth/*`, cookie flags on the session cookie, OAuth state/PKCE for GitHub, JWT signing via `AUTH_SECRET`, session cookie rotation on sign-in. These are framework defaults and out of scope.
- Rate limiting at the platform layer (Vercel / Cloudflare) was not verified from code alone. If such a limiter exists, finding "Medium 1" is partially mitigated; otherwise the application-layer fix stands.
- `.env` files are in `.gitignore` for this repo — not flagged.
- MFA, device management, account lockout after N failed sign-ins, and email-change verification are not built. The agent brief excludes unimplemented features from findings; listing here only for visibility.
- `SignInForm` passes the user-typed email directly to `signIn('credentials', ...)` without a `.toLowerCase()`. Because register stores the email lowercased and the DB lookup in `authorize` (`src/auth.ts:32`) is case-sensitive against a lowercased stored value, a user typing `FOO@bar.com` will fail sign-in. Not a security finding — behavior issue at most — but noted for the team.
