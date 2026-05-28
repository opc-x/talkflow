# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

TalkFlow is an AI-powered English speaking practice app. Core loop: **lesson → speak → AI real-time feedback → SRS review queue**. Content is 191 lessons across 12 books (CEFR A1→C2), mapped to 4 subscription stages.

## Commands

```bash
# Frontend (Next.js, port 3000)
npm run dev

# Backend (Hono API, port 4000) — required for assessment + audio evaluation
npm run dev:api

# Both together
npm run dev:all

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build && npm run build:api

# DB scripts (run against Supabase directly)
npm run db:migrate:scene
npm run db:audit
npm run db:embed-lessons
```

## Architecture: Two Processes

**Frontend** — Next.js 15 App Router + Supabase (direct)
**Backend** — Hono API (`backend/`) + OpenAI — only for AI-heavy operations

```
frontend (Next.js)  ──supabase-js──►  Supabase DB  (all non-AI data ops)
frontend            ──apiFetch──────► backend :4000  (assessment/audio/checkout/search)
```

Frontend calls backend via `lib/api/client.ts` (`apiFetch`). `NEXT_PUBLIC_API_BASE_URL` defaults to `http://localhost:4000/api/v1`. All backend routes require Supabase JWT (`Authorization: Bearer`). The `app/api/` Next.js routes also exist but are separate from the Hono backend.

## Route Structure

All app routes live under `app/[locale]/` — locale is always `zh` (next-intl, single-locale). Protected routes under `app/[locale]/protected/`:

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/onboarding` | Speak-First placement assessment (calls backend) |
| `/protected` | Dashboard |
| `/protected/learn/[bookNum]/[lessonNum]` | Lesson player |
| `/protected/review` | Daily SRS review |
| `/protected/progress` | Learning progress |
| `/protected/map` | Course map (book/lesson grid) |
| `/protected/stats` | Learning statistics |
| `/protected/me` | Profile |
| `/protected/settings` | Settings |
| `/protected/tools` | Dev/admin tools |

## Key Patterns

**Supabase client**: Always use `lib/supabase/server.ts` in Server Components/Actions, `lib/supabase/client.ts` in Client Components. Dev bypass: `DEV_BYPASS_AUTH=true` injects a fake user and uses admin client (bypasses RLS).

**Server Actions**: All data mutations in `protected/` use Server Actions (`"use server"`) with direct supabase-js. No API routes for CRUD — only Hono handles AI/audio.

**Shared code**: `shared/` contains types and logic shared by frontend + backend. Import via `@shared/*` alias on backend, re-exported from `lib/` on frontend (e.g. `lib/stages.ts` re-exports `shared/stages.ts`).

**Subscription/Plan system**: Three tiers — `free` / `basic` / `pro`. Stages 1 (lessons 1–24) are free; stages 2–3 require `basic`; stage 4 requires `pro`. Gate access via `isStageLocked()` from `lib/subscription.ts`. Plan aliases: `daily` → `basic`, `full` → `pro` (handled in `normalizePlan`).

**Styles**: Dashboard/learn pages use **Tailwind + shadcn/ui**. Newer pages (onboarding, review) use **inline styles** with brand colors `#10B981` (green) / `#111111` (bg) / `#1a1a1a` (card) / `#F5F5F5` (text). Match the style of the file you're editing.

## Database Schema (Supabase)

**Static content** (seeded, read-only from app):
- `books` → `lessons` → `content_blocks` → `terms`, `qa_pairs`, `notes`, `exercises`

**User data** (read/write):
- `profiles` — base user record
- `subscriptions` — `plan` (`free`/`basic`/`pro`), `status`, `stripe_id`
- `user_progress` — `current_lesson_id`, `lessons_done[]`
- `session_records` — one row per completed lesson (streak/stats)
- `qa_responses` — per-answer scores (1–5), accuracy stats
- `review_schedule` — SRS state per `qa_pair` or `term`: `next_review_at`, `interval_days`, `ease_factor`, `rep_count`

**Known bug**: `completeLesson()` (`app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts`) does NOT write to `review_schedule` after lesson completion — SRS queue is never populated.

## Dev Bypass Mode

Set in `.env.local`:
```
DEV_BYPASS_AUTH=true                       # backend: skip JWT, use DEV_USER_ID
NEXT_PUBLIC_DEV_BYPASS_AUTH=true           # frontend: fake Supabase session
NEXT_PUBLIC_DEV_TOOLS=true                 # show dev shortcuts in UI
DEV_USER_ID=00000000-0000-0000-0000-000000000001
```

## Backend (Hono)

Located in `backend/`. Routes under `/api/v1/` (all require auth middleware):
- `POST /assessment/evaluate` — Whisper transcription + GPT-4o evaluation
- `POST /assessment/complete` — compute placement result
- `GET /assessment/questions` — fetch assessment questions from DB
- `GET /search` — lesson/content search
- `POST /checkout` — Stripe checkout stub (not yet implemented)

## Path Aliases

```
@/*       →  ./*          (project root)
@shared/* →  ./shared/*   (shared frontend+backend code)
```
