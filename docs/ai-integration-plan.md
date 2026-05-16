# AI Integration Plan

> **Scope:** Add OpenAI-powered AI features to DevStash — auto-tagging, AI summary, explain-this-code, prompt optimizer. Pro-gated. Built to match the patterns already established by the Stripe, R2, and email integrations.

---

## 1. Context & decisions

### 1.1 Model choice — `gpt-5.4-nano`

The research prompt names `gpt-5.4-nano`. As of May 2026, that is OpenAI's smallest/cheapest current-generation model (Nano variant of the GPT-5.4 family released 2026-03-17). Pricing per the OpenAI API pricing page:

| Model           | Input          | Output         | Context  |
| --------------- | -------------- | -------------- | -------- |
| `gpt-5.4-nano`  | $0.20 / 1M tok | $1.25 / 1M tok | 128k     |
| `gpt-5.4-mini`  | ~$0.25 / 1M    | ~$2.00 / 1M    | 128k     |
| `gpt-4o-mini`   | $0.15 / 1M     | $0.60 / 1M     | 128k     |

Indicative cost per call for our use cases (after the input/output caps below):

| Feature           | Avg input | Avg output | Cost / call (gpt-5.4-nano) |
| ----------------- | --------- | ---------- | -------------------------- |
| Auto-tag          | ~500 tok  | ~50 tok    | ~$0.000163                 |
| Summary           | ~800 tok  | ~150 tok   | ~$0.000347                 |
| Explain code      | ~600 tok  | ~400 tok   | ~$0.000620                 |
| Prompt optimizer  | ~400 tok  | ~300 tok   | ~$0.000455                 |

At a hard 500 calls/Pro-user/month budget the worst-case per-user cost is well under $1/month, so the $8/mo Pro plan supports AI at typical usage without per-call billing complexity.

> **⚠️ Inconsistency to fix:** [context/project-overview.md](../context/project-overview.md) still lists `gpt-4o-mini` in the Tech Stack table. Updating that line to `gpt-5.4-nano` is bundled into Phase 1 of the implementation order below.

### 1.2 OpenAI SDK direct vs Vercel AI SDK

The Vercel AI SDK (`ai` package) is a great fit for multi-turn chat + framework-level streaming hooks (`useChat`, `useCompletion`). DevStash's four AI features are **one-shot completions**, not chat:

- Auto-tag: single short request, structured array of strings, no streaming needed
- Summary: single longer response, streaming improves UX
- Explain code: single longer response, streaming improves UX
- Prompt optimizer: single medium response, streaming optional

**Recommendation: use the OpenAI Node SDK directly.** It gives us:

- `client.chat.completions.parse()` + `zodResponseFormat()` for typed structured outputs (auto-tag)
- `client.chat.completions.stream()` for server-sent streaming (summary, explain)
- One fewer dependency to keep on the upgrade treadmill
- The same lazy-cached-client pattern we use for Stripe / Resend / R2

Vercel AI SDK can be added later if/when we build true chat UX or a multi-step agent. The route handlers we'll write below emit SSE in a shape compatible with both `useCompletion` and a hand-rolled `EventSource` consumer, so swapping later is mechanical.

### 1.3 Server actions vs route handlers

Both have their place; pick by streaming need:

| Feature            | Surface          | Reason                                            |
| ------------------ | ---------------- | ------------------------------------------------- |
| Auto-tag           | Server action    | One-shot JSON return, no stream                   |
| Prompt optimizer   | Server action    | One-shot text return, short enough to skip stream |
| Summary            | Route handler    | Streaming `ReadableStream` response (SSE)         |
| Explain code       | Route handler    | Streaming `ReadableStream` response (SSE)         |

Server actions can return streams in Next.js 16 but the wiring for client-side `use()` + Suspense is rougher than a plain SSE route handler consumed by `useCompletion`-style hooks. Route handlers are the path of least resistance for the streaming pair.

### 1.4 What we are not building (v1)

- Multi-turn chat surface
- Image generation / DALL·E
- Embeddings (would be needed for semantic search; future work for `/search`)
- Function-calling tool loops (structured outputs cover our needs)
- Bring-your-own-key support
- Fine-tuning

---

## 2. Architecture overview

```
src/
├── lib/
│   ├── openai.ts                # Lazy client + isAiConfigured()
│   ├── ai-prompts.ts            # System prompts (one export per feature)
│   ├── ai-usage.ts              # Per-user monthly quota via Upstash Redis
│   └── usage-limits.ts          # already has isProForGating(session)
├── lib/validations/
│   └── ai.ts                    # Zod schemas: AutoTagResult, input payloads
├── actions/
│   └── ai.ts                    # autoTag(itemId), optimizePrompt(itemId)
├── app/api/ai/
│   ├── summarize/route.ts       # POST → SSE stream
│   └── explain/route.ts         # POST → SSE stream
└── components/items/
    ├── AiTagSuggestions.tsx     # chip-list with accept/reject
    ├── AiSummaryButton.tsx      # triggers stream + renders progress
    ├── AiExplainButton.tsx      # same shape as summary
    └── AiOptimizePromptButton.tsx
```

### 2.1 Mirror existing integration patterns

The Stripe / R2 / Resend modules share a recipe — follow it for OpenAI:

1. **Lazy client construction** in a `getXxx()` getter, cached in a module-scope `let`. Throws on first use when env is missing.
2. **`isXxxConfigured()`** boolean for routes/actions to 503 short-circuit gracefully when not set up.
3. **Env-var fallback chain** (we already have `getAppUrl()` in both `stripe.ts` and `email.ts`).
4. **All calls server-only.** Never expose the SDK or key to the client bundle.

### 2.2 Gating layers

Every AI entry point passes through five gates, in order:

1. `auth()` — must be signed in
2. `isAiConfigured()` — 503 if API key missing
3. `isAiFeaturesEnabled()` — kill switch via env var
4. `isProForGating(session)` — Pro-only feature (returns `true` in dev per existing rule)
5. `checkAiQuota(userId)` — per-user monthly request budget (Redis counter)
6. `checkRateLimit("ai", userId)` — per-user short-window flood protection

Failure at any step returns a structured error; the client toasts it.

---

## 3. New files (with code)

### 3.1 `src/lib/openai.ts`

Mirrors [src/lib/stripe.ts](../src/lib/stripe.ts) shape.

```typescript
import OpenAI from "openai"

let cached: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (cached) return cached
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("OPENAI_API_KEY is not set")
  cached = new OpenAI({
    apiKey: key,
    maxRetries: 2,            // SDK default; explicit for clarity
    timeout: 30_000,          // 30s; OpenAI calls should never hang
  })
  return cached
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

export function isAiFeaturesEnabled(): boolean {
  if (!isAiConfigured()) return false
  const raw = process.env.AI_FEATURES_ENABLED
  if (typeof raw !== "string") return true   // default ON when configured
  const normalized = raw.trim().toLowerCase()
  return !(normalized === "false" || normalized === "0")
}

export function getAiModel(): string {
  return process.env.OPENAI_MODEL || "gpt-5.4-nano"
}

export function getMaxOutputTokens(): number {
  const raw = process.env.OPENAI_MAX_OUTPUT_TOKENS
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 512
}
```

### 3.2 `src/lib/ai-prompts.ts`

Centralizing prompts so they're versionable + testable + cacheable (OpenAI offers automatic prompt caching when the leading 1024+ tokens are stable). Examples below — refine during implementation against real items.

```typescript
export const SYSTEM_AUTO_TAG = `You are a tagging assistant for a developer-knowledge tool.

Given a single saved snippet/prompt/command/note/link, suggest 3–6 short, lowercase,
kebab-case tags that describe its topic, stack, and intent. Prefer existing dev
ecosystem terms (react, typescript, postgres, prisma, docker, etc.) over invented
phrases. Do not include the item type itself as a tag. Do not exceed 6 tags. Do
not include duplicates.

Return JSON only.`

export const SYSTEM_SUMMARIZE = `You are a summarization assistant for a developer-knowledge tool.

Summarize the given saved item in 1–3 sentences focused on what it does and when
to use it. Use plain English. No markdown headers. No code blocks. Aim for under
60 words.`

export const SYSTEM_EXPLAIN_CODE = `You are a code-explanation assistant.

Given a code snippet, explain step-by-step what it does and any important details
(performance, side effects, idiomatic usage). Use short markdown sections with
H3 headers. Quote short fragments of the original code where it clarifies the
explanation. Do not rewrite the code. Do not propose changes unless asked.`

export const SYSTEM_OPTIMIZE_PROMPT = `You are a prompt-engineering assistant.

The user has saved an AI prompt. Suggest one improved version that is more
specific, less ambiguous, and produces more consistent output. Preserve the
user's intent. Keep the role/context structure if present. Return ONLY the
improved prompt as plain text — no commentary, no explanation, no quotes.`
```

### 3.3 `src/lib/validations/ai.ts`

```typescript
import { z } from "zod"

export const autoTagResultSchema = z.object({
  tags: z
    .array(z.string().min(1).max(40))
    .min(1)
    .max(6),
})
export type AutoTagResult = z.infer<typeof autoTagResultSchema>

export const summarizeInputSchema = z.object({
  itemId: z.string().min(1),
})
export type SummarizeInput = z.infer<typeof summarizeInputSchema>

export const explainInputSchema = z.object({
  itemId: z.string().min(1),
})
export type ExplainInput = z.infer<typeof explainInputSchema>
```

> **Zod 4 note:** the project uses Zod 4. The OpenAI SDK's `zodResponseFormat()` ships a `zod/v3` shim internally; current SDK versions (v6+) accept Zod 4 schemas via `zod/v3` compatibility. Verify on the pinned SDK version at install time — if `zodResponseFormat()` complains, the workaround is to use `zod-to-json-schema` and pass the raw JSON schema instead of the helper.

### 3.4 `src/lib/ai-usage.ts`

Per-user monthly quota, stored as a Redis counter with a calendar-month TTL. Fails open if Upstash is unavailable (same posture as `checkRateLimit`).

```typescript
import { Redis } from "@upstash/redis"

const MONTHLY_AI_LIMIT_PRO = 500   // requests / month / Pro user

let client: Redis | null | undefined
function getRedis(): Redis | null {
  if (client !== undefined) return client
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) { client = null; return null }
  client = new Redis({ url, token })
  return client
}

function currentMonthKey(userId: string): string {
  const d = new Date()
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `ai:usage:${userId}:${year}-${month}`
}

export type AiQuotaCheck = {
  ok: boolean
  used: number
  limit: number
  error?: string
}

export async function checkAiQuota(userId: string): Promise<AiQuotaCheck> {
  const redis = getRedis()
  if (!redis) return { ok: true, used: 0, limit: MONTHLY_AI_LIMIT_PRO } // fail open
  try {
    const key = currentMonthKey(userId)
    const used = Number((await redis.get<number>(key)) ?? 0)
    if (used >= MONTHLY_AI_LIMIT_PRO) {
      return {
        ok: false,
        used,
        limit: MONTHLY_AI_LIMIT_PRO,
        error: `You've reached this month's AI request limit (${MONTHLY_AI_LIMIT_PRO}). Resets on the 1st.`,
      }
    }
    return { ok: true, used, limit: MONTHLY_AI_LIMIT_PRO }
  } catch (err) {
    console.error("[ai-usage] redis error — failing open", err)
    return { ok: true, used: 0, limit: MONTHLY_AI_LIMIT_PRO }
  }
}

export async function recordAiUsage(userId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    const key = currentMonthKey(userId)
    const next = await redis.incr(key)
    // Set TTL to ~32 days on first write so the key auto-expires
    if (next === 1) await redis.expire(key, 32 * 24 * 60 * 60)
  } catch (err) {
    console.error("[ai-usage] redis incr error", err)
  }
}
```

For real-time analytics (per-feature breakdowns, average tokens used, etc.) we can later add an `AiUsage` Prisma model. v1 keeps it in Redis to avoid a migration.

### 3.5 `src/lib/rate-limit.ts` — add `"ai"` profile

```typescript
// existing file — add to the union and PROFILES const

export type RateLimitProfile =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "resend-verification"
  | "ai"  // ← new

const PROFILES: Record<RateLimitProfile, ProfileConfig> = {
  // ... existing ...
  ai: { limit: 30, window: "5 m" },   // 30 AI calls / 5min / user
}
```

Identifier passed to `checkRateLimit("ai", userId)` is the user id (already Pro-gated, so no IP fallback noise).

### 3.6 `src/actions/ai.ts`

Two server actions for the non-streaming features. Mirrors the discriminated-union return shape used everywhere else in `src/actions/`.

```typescript
"use server"

import { z } from "zod"
import { zodResponseFormat } from "openai/helpers/zod"
import { auth } from "@/auth"
import { getDemoUserId } from "@/lib/db/collections"
import { getItemDetail } from "@/lib/db/items"
import { isProForGating } from "@/lib/usage-limits"
import {
  getAiModel,
  getMaxOutputTokens,
  getOpenAI,
  isAiConfigured,
  isAiFeaturesEnabled,
} from "@/lib/openai"
import { checkAiQuota, recordAiUsage } from "@/lib/ai-usage"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  SYSTEM_AUTO_TAG,
  SYSTEM_OPTIMIZE_PROMPT,
} from "@/lib/ai-prompts"
import { autoTagResultSchema } from "@/lib/validations/ai"
import { truncateForAi } from "@/lib/ai-input"

type AiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: "unauthorized" | "not_pro" | "not_configured" | "quota" | "rate_limited" | "not_found" }

async function aiGate(): Promise<{ ok: true; userId: string } | { ok: false; result: AiResult<never> }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, result: { success: false, error: "Not authenticated", code: "unauthorized" } }
  if (!isAiConfigured() || !isAiFeaturesEnabled()) return { ok: false, result: { success: false, error: "AI is not available right now.", code: "not_configured" } }
  if (!isProForGating(session)) return { ok: false, result: { success: false, error: "AI features are a Pro feature.", code: "not_pro" } }

  const userId = (await getDemoUserId()) ?? session.user.id

  const quota = await checkAiQuota(userId)
  if (!quota.ok) return { ok: false, result: { success: false, error: quota.error!, code: "quota" } }

  const rl = await checkRateLimit("ai", userId)
  if (!rl.success) return { ok: false, result: { success: false, error: "Too many AI requests. Wait a moment.", code: "rate_limited" } }

  return { ok: true, userId }
}

export async function autoTagItem(itemId: string): Promise<AiResult<{ tags: string[] }>> {
  const gate = await aiGate()
  if (!gate.ok) return gate.result

  const item = await getItemDetail(itemId, gate.userId)
  if (!item) return { success: false, error: "Item not found", code: "not_found" }

  const inputPayload = truncateForAi({
    title: item.title,
    description: item.description,
    content: item.content,
    url: item.url,
    type: item.typeName,
  })

  try {
    const completion = await getOpenAI().chat.completions.parse({
      model: getAiModel(),
      messages: [
        { role: "system", content: SYSTEM_AUTO_TAG },
        { role: "user", content: JSON.stringify(inputPayload) },
      ],
      response_format: zodResponseFormat(autoTagResultSchema, "tag_suggestions"),
      max_completion_tokens: 100,
    })

    await recordAiUsage(gate.userId)

    const parsed = completion.choices[0]?.message?.parsed
    if (!parsed) return { success: false, error: "AI returned no result" }

    const dedupedTags = Array.from(new Set(parsed.tags.map(t => t.trim().toLowerCase()))).slice(0, 6)
    return { success: true, data: { tags: dedupedTags } }
  } catch (err) {
    console.error("autoTagItem failed", err)
    return { success: false, error: "Failed to generate tag suggestions" }
  }
}

export async function optimizePrompt(itemId: string): Promise<AiResult<{ optimized: string }>> {
  const gate = await aiGate()
  if (!gate.ok) return gate.result

  const item = await getItemDetail(itemId, gate.userId)
  if (!item) return { success: false, error: "Item not found", code: "not_found" }
  if (item.typeName !== "prompt") {
    return { success: false, error: "This feature is only available for prompts." }
  }
  if (!item.content?.trim()) {
    return { success: false, error: "Prompt is empty." }
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: getAiModel(),
      messages: [
        { role: "system", content: SYSTEM_OPTIMIZE_PROMPT },
        { role: "user", content: item.content.slice(0, 8000) },
      ],
      max_completion_tokens: getMaxOutputTokens(),
    })

    await recordAiUsage(gate.userId)

    const optimized = completion.choices[0]?.message?.content?.trim()
    if (!optimized) return { success: false, error: "AI returned no result" }

    return { success: true, data: { optimized } }
  } catch (err) {
    console.error("optimizePrompt failed", err)
    return { success: false, error: "Failed to optimize prompt" }
  }
}
```

### 3.7 `src/lib/ai-input.ts` — input shaping

Pure helper, unit-testable. Caps cost by capping input size.

```typescript
const MAX_TITLE = 200
const MAX_DESCRIPTION = 800
const MAX_CONTENT = 4_000   // ~1k tokens; covers all but very long snippets
const MAX_URL = 500

export type AiInputItem = {
  title: string
  description: string | null
  content: string | null
  url: string | null
  type: string
}

export function truncateForAi(item: AiInputItem): AiInputItem {
  return {
    type: item.type,
    title: item.title.slice(0, MAX_TITLE),
    description: item.description ? item.description.slice(0, MAX_DESCRIPTION) : null,
    content: item.content ? item.content.slice(0, MAX_CONTENT) : null,
    url: item.url ? item.url.slice(0, MAX_URL) : null,
  }
}
```

Unit-test cases: every field truncates at its cap; nulls pass through; content shorter than cap is unchanged; cap boundaries (exactly-at, one-over).

### 3.8 `src/app/api/ai/summarize/route.ts` — streaming SSE

```typescript
import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { getDemoUserId } from "@/lib/db/collections"
import { getItemDetail } from "@/lib/db/items"
import { isProForGating } from "@/lib/usage-limits"
import {
  getAiModel,
  getMaxOutputTokens,
  getOpenAI,
  isAiConfigured,
  isAiFeaturesEnabled,
} from "@/lib/openai"
import { checkAiQuota, recordAiUsage } from "@/lib/ai-usage"
import { checkRateLimit } from "@/lib/rate-limit"
import { SYSTEM_SUMMARIZE } from "@/lib/ai-prompts"
import { truncateForAi } from "@/lib/ai-input"
import { summarizeInputSchema } from "@/lib/validations/ai"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })
  if (!isAiConfigured() || !isAiFeaturesEnabled()) return new Response("AI not available", { status: 503 })
  if (!isProForGating(session)) return new Response("Pro feature", { status: 403 })

  const userId = (await getDemoUserId()) ?? session.user.id

  const quota = await checkAiQuota(userId)
  if (!quota.ok) return new Response(quota.error, { status: 429 })

  const rl = await checkRateLimit("ai", userId)
  if (!rl.success) return new Response("Too many requests", { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = summarizeInputSchema.safeParse(body)
  if (!parsed.success) return new Response("Invalid input", { status: 400 })

  const item = await getItemDetail(parsed.data.itemId, userId)
  if (!item) return new Response("Item not found", { status: 404 })

  const payload = truncateForAi({
    title: item.title,
    description: item.description,
    content: item.content,
    url: item.url,
    type: item.typeName,
  })

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      try {
        const openaiStream = await getOpenAI().chat.completions.create({
          model: getAiModel(),
          stream: true,
          max_completion_tokens: getMaxOutputTokens(),
          messages: [
            { role: "system", content: SYSTEM_SUMMARIZE },
            { role: "user", content: JSON.stringify(payload) },
          ],
        })

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) controller.enqueue(enc.encode(delta))
        }

        await recordAiUsage(userId)
        controller.close()
      } catch (err) {
        console.error("summarize stream failed", err)
        controller.enqueue(enc.encode("\n\n[error: failed to generate summary]"))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
```

> **Stream shape decision:** we're streaming plain text (not SSE `data:` framing). The client reads it via `fetch().then(res => res.body.getReader())` and appends each chunk. This is the simplest possible setup and avoids the parsing complexity of `text/event-stream`. If we later add Vercel AI SDK, switch the Content-Type and use `toUIMessageStreamResponse()`.

### 3.9 `src/app/api/ai/explain/route.ts`

Same shape as `summarize` — only difference is the system prompt (`SYSTEM_EXPLAIN_CODE`) and a precondition that the item type is `snippet` or `command`.

---

## 4. Modified files

### 4.1 [src/lib/usage-limits.ts](../src/lib/usage-limits.ts)

No changes needed for now — `isProForGating(session)` already handles the dev override. The AI surface uses it as-is. **However**, if we ever want a free-tier "first 10 AI calls free" trial, this is the file where a new helper lives.

### 4.2 [src/lib/rate-limit.ts](../src/lib/rate-limit.ts)

Add the `"ai"` profile shown in §3.5.

### 4.3 [src/components/items/ItemDrawer.tsx](../src/components/items/ItemDrawer.tsx) and friends

Add three new action-bar buttons in `DrawerView`, gated by item type and Pro:

- All types: **Suggest tags** → opens an inline `AiTagSuggestions` panel beneath the description
- Most types: **Summarize** → opens a slide-down summary section
- Snippet / command: **Explain this code** → expands a markdown-rendered explanation
- Prompt type only: **Optimize** → opens a side-by-side diff view (original vs improved) with Accept/Reject

The action-bar already supports adding new `ActionButton` entries. The new components below render under the existing detail layout in `DrawerView`.

### 4.4 [context/project-overview.md](../context/project-overview.md)

Update Tech Stack row from `OpenAI gpt-4o-mini` → `OpenAI gpt-5.4-nano (configurable via OPENAI_MODEL)`.

### 4.5 `.env.example`

```
# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-nano               # optional override
OPENAI_MAX_OUTPUT_TOKENS=512            # optional per-call cap
AI_FEATURES_ENABLED=true                # kill switch; default true when key is set
```

The file is gitignored locally per the long-standing project pattern — edit your local copy.

---

## 5. UI patterns

### 5.1 Loading states

- **Auto-tag (non-streaming):** "Suggesting tags…" with a small pulse-dot animation in the chip area. Disable the trigger button while pending. Typically completes in <2s for gpt-5.4-nano.
- **Streaming (summary, explain):** progressively-rendered text as it arrives. Cursor pseudo-element pulses at the trailing edge while the stream is open. Disable any retry/cancel button until the stream closes. Provide an explicit cancel — wire `AbortController.abort()` to `fetch()` and let the route handler exit on `req.signal.aborted`.
- **Prompt optimizer:** "Optimizing…" submit-button state; render the result inline below the original with a clear visual divider and Accept/Reject buttons.

### 5.2 Accept/reject suggestions

Auto-tag is the surface where this matters most. The pattern that works:

```
┌─────────────────────────────────────────┐
│ Suggested tags                          │
│ ┌──────┐ ┌──────┐ ┌─────────────┐       │
│ │react │ │hooks │ │debouncing   │ ...   │  ← each chip toggles selected
│ └──────┘ └──────┘ └─────────────┘       │
│                                         │
│ [ Cancel ]              [ Add 3 tags ]  │  ← only selected chips get added
└─────────────────────────────────────────┘
```

- Suggestions render as toggleable chips (clicking selects/deselects)
- "Add N tags" button shows count of selected; disabled at 0
- Existing item tags are pre-filtered out of suggestions client-side so we don't show duplicates
- On accept, we call the existing `updateItem` server action with the merged tag list — **the AI surface never directly writes tags.** This keeps the existing validation + dedup logic intact.

### 5.3 Streamed markdown rendering

For `explain` (which returns markdown), use the existing `MarkdownEditor` in read-only mode. The drawer already has it wired up. Pass `value={streamingText}` from a `useState` that the chunk consumer appends to. React's batching handles the re-render frequency fine; if it ever feels too rapid, debounce updates to every ~100ms.

### 5.4 Error states

Mirror the existing toast pattern used by `createItem` / `updateItem`:

```typescript
const result = await autoTagItem(item.id)
if (!result.success) {
  toast.error(result.error)
  return
}
// happy path
```

Distinct copy by error code:

- `quota` → "You've reached this month's AI request limit." + link to /settings#billing
- `rate_limited` → "Too many AI requests. Wait a moment."
- `not_pro` → "AI features are a Pro feature." + link to /settings#billing
- `not_configured` → "AI is not available right now." (server-side issue, no user action)
- generic → existing fallback copy

### 5.5 Settings surface

Add a small "AI Usage" tile inside the existing Billing section on `/settings`:

```
Plan: DevStash Pro · Unlimited everything.
[Manage billing]

AI usage this month: 42 / 500 requests
```

Fetch via a thin `getAiUsage(userId)` helper added to `ai-usage.ts` that reads the current-month counter. Refresh on page navigation; no live update needed.

---

## 6. Security considerations

### 6.1 API key handling

- `OPENAI_API_KEY` is server-only. Never prefix with `NEXT_PUBLIC_`.
- The OpenAI SDK is only imported by `src/lib/openai.ts`, which is only imported by `src/actions/ai.ts` and `src/app/api/ai/**/*.ts`. None of these files have `"use client"` so the SDK can never accidentally leak to the client bundle.
- The lazy-cached client pattern means even import-time mistakes (forgetting to set the env var locally) don't crash the build; the error surfaces only at runtime call sites.

### 6.2 Input sanitization

- Zod schemas validate `itemId` shapes server-side; we never trust client-supplied `content` directly — we re-fetch from the DB by id under the same auth gate.
- `truncateForAi` caps every field at known maxima so a malicious item with a 10MB description can't drive a huge OpenAI bill.
- Items are owned-per-user via the existing `findFirst({ where: { id, userId } })` ownership pattern; AI actions reuse `getItemDetail(itemId, userId)`.

### 6.3 Output sanitization

- All AI responses are rendered through `ReactMarkdown` with `remarkGfm` (the same path the existing markdown editor uses). React escapes anything that looks like raw HTML; ReactMarkdown's renderer doesn't honor `dangerouslySetInnerHTML`. Net: even if the model emits `<script>` tags, they render as text.
- Auto-tag results are passed through Zod schema validation (3–6 strings, ≤40 chars each, lowercase post-process) so a malformed model response can't poison the tag join table.

### 6.4 Secret-leakage risk

Users routinely paste API keys / DB URLs / SSH keys into snippets and prompts. Sending those to OpenAI is an exfiltration risk worth being explicit about. v1 mitigation:

- A note in `/settings#billing` near the AI usage tile: "AI features send the content of the item you choose to OpenAI. Avoid using AI on items containing secrets."
- Optionally: a regex pre-scan in `truncateForAi` that detects common secret patterns (`sk_live_...`, `AKIA...`, RSA preludes, etc.) and either redacts or warns. Defer to v2 unless legal/comms surfaces it.

### 6.5 Prompt injection

The user **owns** their items, so injection through item content is essentially self-injection (no other user's data is at risk). The features here also don't take privileged actions on the AI's behalf, so even fully-compromised output can't escalate. Documenting the risk for the record; no v1 mitigation needed.

### 6.6 Logging

- Never log full prompts or completions (would echo user secrets to server logs / Sentry).
- Log on error: model used, item id, user id, OpenAI request id from response headers, error category. The request id is the lever to dig into a specific failure on the OpenAI dashboard.

### 6.7 CORS / route hardening

The `/api/ai/*` routes are POST-only and check `auth()` first — no CORS preflight surface concerns beyond what Next.js provides by default. Don't add `Access-Control-Allow-Origin: *` here.

---

## 7. Cost optimization

| Lever                       | Where                                       | Impact                                              |
| --------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Smallest model              | `getAiModel()` default                      | 8x cheaper than gpt-5.4-mini at same output         |
| Input caps                  | `truncateForAi`                             | Hard upper bound on input tokens / call             |
| Output caps                 | `max_completion_tokens` (env-tunable)       | Hard upper bound on output tokens / call            |
| Monthly per-user budget     | `ai-usage.ts` (500 req/Pro/month default)   | Caps worst-case user cost at ~$0.30/mo             |
| Per-user rate limit         | `rate-limit.ts` "ai" profile                | Caps burst abuse                                    |
| Stable system prompts       | `ai-prompts.ts`                             | OpenAI auto-caches prompts ≥1024 tok (50% discount) |
| Cache derived results       | (v2) store auto-tags / summary on the item  | Skip repeat calls when content unchanged            |
| Skip empty content          | `optimizePrompt` content-empty guard        | No call for items that can't usefully be processed  |
| Abortable streams           | `AbortController` on client + `req.signal`  | User cancels = early token stop                     |

If we ever want sharper visibility, log the `x-request-id` header from OpenAI responses and the usage block (`completion.usage.{prompt,completion,total}_tokens`) to a small `AiUsage` Prisma model. v2 work.

---

## 8. Testing

Per [context/coding-standards.md](../context/coding-standards.md): server actions + utility/library code in scope, components and Prisma-touching DB code out of scope (no Prisma mocking).

### 8.1 Unit-testable surface

| File                       | Test scope                                                            |
| -------------------------- | --------------------------------------------------------------------- |
| `src/lib/openai.ts`        | `isAiConfigured`, `isAiFeaturesEnabled`, `getAiModel`, `getMaxOutputTokens` — env-parsing branches mirroring `r2.test.ts` / `features.test.ts` / `stripe.test.ts` |
| `src/lib/ai-input.ts`      | `truncateForAi` — every field at/under/over its cap, null handling     |
| `src/lib/validations/ai.ts`| `autoTagResultSchema` — empty/too-many/length-bound/duplicate cases    |
| `src/lib/ai-usage.ts`      | `currentMonthKey` shape (extract as exported pure helper) — boundary at UTC month rollover |

Expected: ~25 new test cases. Suite goes from 199 → ~224.

### 8.2 Not unit-tested (per project rules)

- `src/actions/ai.ts` (auth + Prisma + Redis + OpenAI)
- `src/app/api/ai/**/route.ts` (auth + Prisma + Redis + OpenAI)
- All UI components

### 8.3 Manual QA checklist (for the implementation PR)

- [ ] Auto-tag suggests sensible tags for a real snippet
- [ ] Accept partial selection — only checked tags get added
- [ ] Streaming summary renders progressively (not all-at-once on close)
- [ ] Cancel button aborts in-flight stream
- [ ] Free user (real Pro: false in prod) gets `not_pro` toast
- [ ] Dev mode (NODE_ENV != production) bypasses Pro check
- [ ] Quota exceeded surfaces the right copy
- [ ] Rate limit (31 calls in 5min) returns the right copy
- [ ] Missing `OPENAI_API_KEY` returns `not_configured` cleanly (no 500)
- [ ] OpenAI 5xx response surfaces "Failed to …" without leaking SDK error
- [ ] Long item content (>4k chars) gets truncated; no OpenAI 400 error
- [ ] Prompt optimizer on a non-prompt item returns the right error
- [ ] Markdown rendering of explain output looks correct in the drawer

---

## 9. Implementation order

### Phase 1 — Infrastructure (no user-visible features)

Goal: AI is wired but no buttons yet.

1. `src/lib/openai.ts` + tests
2. `src/lib/ai-input.ts` + tests
3. `src/lib/validations/ai.ts` + tests
4. `src/lib/ai-usage.ts` (plus exported pure helper for the key shape) + tests
5. Update `src/lib/rate-limit.ts` to add `"ai"` profile (no new tests — profile config is data)
6. Update `context/project-overview.md` model line
7. `.env.example` additions (locally)
8. Install SDK: `npm i openai`

Single commit, no UI changes. Expected: suite 199 → ~224.

### Phase 2 — Auto-tag (simplest feature)

Goal: end-to-end smallest possible AI feature lands.

1. `src/lib/ai-prompts.ts` (`SYSTEM_AUTO_TAG` only)
2. `src/actions/ai.ts::autoTagItem`
3. `src/components/items/AiTagSuggestions.tsx`
4. Wire into `ItemDrawer` view + edit
5. Manual QA pass

Single feature commit. No new tests beyond Phase 1 (action + component are out of scope per project rules).

### Phase 3 — Summary + Explain (streaming pair)

Goal: streaming UX works.

1. `SYSTEM_SUMMARIZE` + `SYSTEM_EXPLAIN_CODE` prompts
2. `src/app/api/ai/summarize/route.ts`
3. `src/app/api/ai/explain/route.ts`
4. Shared `useAiStream` client hook (small wrapper around `fetch` + ReadableStream reader + `AbortController`)
5. `AiSummaryButton`, `AiExplainButton` components in the item drawer
6. Manual QA pass — focus on cancel + error paths

One commit. Possibly split if it grows beyond ~400 lines diff.

### Phase 4 — Prompt Optimizer

Goal: round out the four AI features.

1. `SYSTEM_OPTIMIZE_PROMPT`
2. `src/actions/ai.ts::optimizePrompt`
3. `AiOptimizePromptButton` (side-by-side diff view, Accept persists via `updateItem`)
4. Manual QA pass

### Phase 5 — Settings surface

Goal: usage visibility.

1. Add `getAiUsage(userId)` helper to `ai-usage.ts`
2. Render "AI usage this month: N / 500" inside the existing `BillingSection`
3. Manual QA pass

---

## 10. Known unknowns / things to verify at implementation time

1. **Zod 4 ↔ `zodResponseFormat` compatibility.** Verify on the pinned SDK version. Workaround: pass a hand-written JSON schema if the helper barfs.
2. **`gpt-5.4-nano` JSON-mode reliability.** Nano models occasionally return malformed JSON despite `response_format`. `client.chat.completions.parse()` will throw on parse failure — we should catch and either retry once or fall back to a simpler prompt. The Zod schema validation in `autoTagResultSchema` is the safety net.
3. **Streaming with OpenAI SDK in Next.js 16 edge runtime.** We've pinned `runtime = "nodejs"` to avoid this question. If a future requirement demands edge, the SDK supports `fetch`-based clients and works in edge, but Upstash and Prisma can be edge-tricky; revisit then.
4. **OpenAI rate limits.** OpenAI tier 1 (default for a fresh account) limits gpt-5.4-nano to 500 RPM and 200k TPM. Our per-user 30/5min rate limit translates to a max of ~360 RPM if 60 users were maxing simultaneously — should be fine, but watch for 429s from OpenAI itself in early production and consider raising our tier if needed.
5. **Item type used for explain.** Restricting to `snippet`/`command` matches the spec language; verify this matches the UI you want to surface (some users may want to "explain" a note or prompt that contains code).

---

## 11. Out of scope / future iterations

- **Embeddings + semantic search.** Would mean a new Prisma model with a pgvector column, embedding-on-write, and re-wiring `/search` and the command palette. Substantial follow-up.
- **AI-generated collection summaries.** "Summarize this collection of 20 items" — useful but needs token-budgeting (collections can be much larger than single items).
- **AI-suggested collections.** "Bucket my untagged items into 3 collections." Same token budgeting story.
- **Per-feature usage breakdown UI.** v1 shows one combined counter; v2 could split by feature.
- **Bring-your-own-key.** Users supply their own `OPENAI_API_KEY` to bypass the per-user cap. Compelling for power users but adds key storage + security review surface.
- **Function/tool calling.** Not needed for these four features.
- **Multi-model A/B.** Compare gpt-5.4-nano vs gpt-5.4-mini side-by-side for a given prompt. Useful for prompt tuning, premature for v1.

---

## Sources

- [OpenAI API Pricing](https://openai.com/api/pricing/) — current pricing for all OpenAI models
- [GPT 5.4 Nano API Pricing 2026](https://pricepertoken.com/pricing-page/model/openai-gpt-5.4-nano) — third-party tracking page; useful sanity check
- [GPT 5.4 Complete Guide 2026 (NxCode)](https://www.nxcode.io/resources/news/gpt-5-4-complete-guide-features-pricing-models-2026) — release timeline for the GPT-5.4 family
- [OpenAI Node SDK README](https://github.com/openai/openai-node) — client construction, retries, timeout, error shape
- [OpenAI Node SDK helpers.md](https://github.com/openai/openai-node/blob/master/helpers.md) — `chat.completions.parse()`, `zodResponseFormat()`, streaming helpers
- [Structured model outputs (OpenAI docs)](https://platform.openai.com/docs/guides/structured-outputs) — `response_format` + JSON schema reference
- [Streaming API responses (OpenAI docs)](https://developers.openai.com/api/docs/guides/streaming-responses) — SSE shape for chat completion streams
- [Vercel AI SDK 5 announcement & docs](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) — context on why we're not using it for v1
- [OpenAI Structured Outputs vs Zod (dev.to)](https://dev.to/whoffagents/openai-structured-outputs-vs-zod-which-to-use-for-llm-response-validation-in-2026-366m) — practical comparison; supports the recommendation to use the SDK helper
