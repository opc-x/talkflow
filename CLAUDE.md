# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

TalkFlow is an AI-powered English speaking practice app. The underlying content structure (191 lessons, 12 books, CEFR A1→C2) is sourced from Callan Method as raw material, but the product distills it into a speak-first AI experience — not a Callan Method replication. The core loop: **lesson → speak → AI real-time feedback → SRS review queue**.

## Commands

```bash
# Frontend (Next.js, port 3000)
npm run dev

# Backend (Hono API, port 4000) — required for onboarding assessment + audio evaluation
npm run dev:api

# Both together
npm run dev:all

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build && npm run build:api
```

## Architecture: Two Processes

**Frontend** — Next.js 15 App Router + Supabase (direct)
**Backend** — Hono API (`backend/`) + OpenAI — only used for AI-heavy operations

```
frontend (Next.js)  ──supabase-js──►  Supabase DB  (all non-AI data ops)
frontend            ──fetch──────────► backend :4000  (assessment/audio/checkout)
```

The frontend calls the backend via `lib/api/client.ts` (`apiFetch`). `NEXT_PUBLIC_API_BASE_URL` defaults to `http://localhost:4000/api/v1`. All backend routes require a Supabase JWT (set via `Authorization: Bearer`).

## Route Structure

All app routes live under `app/[locale]/` (locale is always `zh`). Protected routes are under `app/[locale]/protected/`:

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/onboarding` | Speak-First placement assessment (real AI, calls backend) |
| `/protected` | Dashboard / home |
| `/protected/learn/[bookNum]/[lessonNum]` | Lesson player |
| `/protected/review` | Daily SRS review |
| `/protected/stats` | Learning statistics |
| `/protected/map` | Course map (book/lesson grid) |
| `/protected/me` | Profile |

## Key Patterns

**Supabase client**: Always use `lib/supabase/server.ts` in Server Components/Actions, `lib/supabase/client.ts` in Client Components. The server client supports `DEV_BYPASS_AUTH=true` which injects a fake user — use this for local dev without real auth.

**Server Actions**: Data mutations in `protected/` use Server Actions (`"use server"`) with direct supabase-js. No API routes for CRUD — only the Hono backend handles AI/audio.

**Shared code**: `shared/` contains types and logic used by both frontend and backend. Import via `@shared/*` alias.

**Styles**: The app mixes paradigms — dashboard/learn pages use **Tailwind + shadcn/ui**, but some newer pages (onboarding, review) use **inline styles** with brand colors `#10B981` (green) / `#111111` (bg) / `#1a1a1a` (card) / `#F5F5F5` (text). Match the style of the file you're editing.

**Stages**: `shared/stages.ts` maps lesson numbers to CEFR stages. Import via `lib/stages.ts` on the frontend.

## Database Schema (Supabase)

**Static content** (seeded, read-only from app):
- `books` → `lessons` → `content_blocks` → `terms`, `qa_pairs`, `notes`, `exercises`
- `qa_pairs` has `lesson_id` — used to populate SRS queue on lesson complete

**User data** (read/write):
- `profiles` — base user record
- `subscriptions` — `plan` (`free`/`basic`/`pro`), `status`, `stripe_id`
- `user_progress` — `current_lesson_id`, `lessons_done[]`
- `session_records` — one row per completed lesson, used for streak/stats
- `qa_responses` — per-answer scores (1–5), used for accuracy stats
- `review_schedule` — SRS state per `qa_pair` or `term`: `next_review_at`, `interval_days`, `ease_factor`, `rep_count`

**Critical gap**: `completeLesson()` (`app/[locale]/protected/learn/[bookNum]/[lessonNum]/actions.ts`) does NOT yet write to `review_schedule` after lesson completion — the SRS queue is never populated. This is a known bug.

## Dev Bypass Mode

Set in `.env.local`:
```
DEV_BYPASS_AUTH=true                        # backend: skip JWT, use DEV_USER_ID
NEXT_PUBLIC_DEV_BYPASS_AUTH=true           # frontend: fake Supabase session
NEXT_PUBLIC_DEV_TOOLS=true                 # show dev shortcuts in UI
DEV_USER_ID=00000000-0000-0000-0000-000000000001
```

## Backend (Hono)

Located in `backend/`. Three routes under `/api/v1/` (all require auth):
- `POST /assessment/evaluate` — Whisper transcription + GPT-4o evaluation of a spoken answer
- `POST /assessment/complete` — compute placement result from all round evaluations
- `GET /assessment/questions` — fetch assessment questions from DB
- `POST /checkout` — Stripe checkout stub (not yet implemented)

Auth middleware (`backend/src/middleware/auth.ts`) validates the Supabase JWT and attaches `supabase` client + `userId` to context.

## Path Aliases

```
@/*      →  ./*           (project root)
@shared/* →  ./shared/*   (shared frontend+backend code)
```
