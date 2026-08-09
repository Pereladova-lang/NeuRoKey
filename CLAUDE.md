# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

NeuRoKey — a neuro-adaptive educational platform concept: before a child gets access to
high-dopamine content (YouTube, TikTok, games), they complete a short adaptive cognitive-training
session. The repo root is a **planning/research monorepo** (product docs, specs, TZ); the only
buildable code lives in `neurokey-pilot/`, a Next.js pilot app for the 11–14 age cohort.

Interface language is Russian throughout (UI copy, product docs). Code identifiers, comments, and
commit messages are English.

## Repo layout

```
/                                   product docs, research, specs (see below)
docs/superpowers/specs/             design specs — source of truth for behavior
docs/superpowers/plans/             TDD implementation plans (task-by-task, checkbox tracked)
neurokey-pilot/                     the actual Next.js application (only code that runs)
recovered-uncommitted/              drafts recovered after a 2026-08-08 hardware crash; not yet triaged/merged into the docs above — check before treating as current
```

Key docs, in reading order for a new task:
- `brief.md` — original TZ (product requirements, MVP scope, metrics)
- `docs/superpowers/specs/2026-07-15-neurokey-pilot-design.md` — pilot design spec, source of truth for the 11–14 cohort implemented in `neurokey-pilot/`
- `PLAN.md` / `docs/superpowers/plans/2026-07-15-neurokey-pilot-v1.md` — the TDD task plan that built the pilot (useful for *why* the code looks the way it does, not for current status — check git log instead)
- `docs/superpowers/specs/2026-08-03-age-cohort-mechanics-design.md` — extends the pilot mechanics to 7–10 and 15–18 cohorts; **not yet implemented** in code (schema still lacks `Exercise.ageCohort`)
- `ARCHITECTURE_DIAGRAMS.md`, `ARCHITECTURE_QUICK_REFERENCE.md`, `WEB_APP_ARCHITECTURE_RESEARCH.md` — generic web-app UX/architecture research, not NeuRoKey-specific decisions; treat as reference material, not requirements

## Commands (run inside `neurokey-pilot/`)

```bash
npm run dev              # dev server, http://localhost:3000
npm run build             # production build
npm run lint               # eslint

npx vitest run                                 # all unit + integration tests
npx vitest run tests/unit/engine.test.ts        # single test file
npx vitest                                       # watch mode
npx playwright test                              # e2e tests

npx prisma migrate dev --name <name>            # create + apply a migration
npx prisma db seed                              # run prisma/seed.ts (90 hand-authored exercises)
npx prisma studio                                # inspect the SQLite DB
```

There is no root-level build — always `cd neurokey-pilot` first. `DATABASE_URL` and `AUTH_SECRET`
must be set (see `.env.example`); DB is SQLite (`file:./dev.db`).

## Architecture (neurokey-pilot)

Monolith Next.js App Router: UI + API routes in one app, SQLite via Prisma. Core domain logic is
kept as **pure, unit-tested functions in `src/lib/`**, separate from UI/API, so behavior can be
tested without a database or network:

- `src/lib/engine.ts` — the whole adaptive rule engine: `nextLevel` (level up/down from recent
  accuracy), `pickSessionTypes` (rotates the 3 exercise types, avoids repeating the previous
  session's first type), `computeScores` (per-exercise cognitive score contribution),
  `nextStreak` (daily streak logic), `earnedBadges`, `aggregateWeek` (week-over-week score deltas
  for the parent dashboard). This file is the one to read first to understand the product.
- `src/lib/exercise-types.ts` — shared types (`CognitiveScores`, etc.)
- `src/lib/db.ts` — Prisma client singleton
- `src/content/{comics,dataTasks,robotTasks}.ts` — the 90 hand-authored exercise variants (content,
  not code logic); validated by `tests/unit/seed-content.test.ts`
- `src/components/ui/` — shadcn/ui components
- `prisma/schema.prisma` — data model (see below)

### Data model

`Parent` 1—1 `Subscription`, 1—N `Child`. `Child` 1—N `Session` (a play session), 1—N
`Achievement`. `Session` 1—N `SessionResult`, each pointing at an `Exercise`. `Config` is a
key-value table for tunable values (e.g. `trialDays`).

### Core domain concepts

- **Exercise types**: `comic`, `data`, `robot` — every session is exactly 3 exercises, one of
  each type in rotated order.
- **Levels**: 1–3 per exercise, adjusted by `nextLevel` based on recent accuracy (drop a level
  below 50% accuracy; rise after 3 consecutive sessions at ≥80% on the current level).
- **Cognitive scales** (0–100, computed weekly in `aggregateWeek`): `attention`, `memory`,
  `logic`, `control`. Each exercise type has fixed weights across these 4 scales
  (`TYPE_WEIGHTS` in `engine.ts`).
- **Age cohorts**: pilot code only implements 11–14. The 7–10 and 15–18 spec
  (`2026-08-03-age-cohort-mechanics-design.md`) adds `Exercise.ageCohort` and a pure
  `ageCohortFor(age)` classifier, computed on read rather than stored on `Child` — not yet in
  the Prisma schema, check before assuming it exists.
- **Subscription**: statuses `trial | active | past_due | expired | canceled`; 3-day trial
  (`Config.trialDays`); free tier after trial = 1 exercise/day.
- **Gamification**: no red crosses / failure penalties on a wrong answer — only a hint and
  retry. Badges: `firstSession`, `sessions10`, `streak3`, `streak7`, `level2`, `level3`.

### Design constraints (from the spec, apply to any UI work)

- Primary `#6366F1`, secondary `#06B6D4`, font Inter.
- Child-facing UI: text ≥18px, touch targets ≥44px.

## Working conventions

- TDD: the implementation plan (`PLAN.md`) was built task-by-task, each starting from a failing
  test, with a commit per task — follow the same pattern for new work in `neurokey-pilot/`.
- Commit messages and code are in English even though the product and specs are in Russian.
- `neurokey-pilot/AGENTS.md` flags that the vendored Next.js version has breaking changes vs.
  training data — check `node_modules/next/dist/docs/` before relying on remembered Next.js APIs.

## Git / recovery context

This repo's local `.git` was corrupted in a hardware failure (2026-08-08) and was rebuilt from
loose objects via `git fsck --dangling`; full commit history was recoverable and is intact. Branches
`main`, `master`, and `feature/pilot-v1` on `origin` (github.com/Pereladova-lang/NeuRoKey) are
currently all fast-forwarded to the same commit. `recovered-uncommitted/` holds drafts (docx TZ
versions, a competitor analysis, a pitch doc) that existed as staged-but-uncommitted work at crash
time — review and fold into the docs above rather than treating them as a separate source of truth.
