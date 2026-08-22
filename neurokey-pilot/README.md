# NeuRoKey — pilot (11–14 age cohort)

Next.js pilot app: a child completes a short adaptive cognitive-training session
(comic, data-analysis, robot-logic exercises) before earning access to their
reward content. See `../brief.md` and
`../docs/superpowers/specs/2026-07-15-neurokey-pilot-design.md` in the repo
root for the product spec.

## Setup

```bash
docker compose up -d      # starts local Postgres (see docker-compose.yml)
npm install
npx prisma migrate dev    # applies migrations to the local Postgres DB
npx prisma db seed        # loads the 90 hand-authored exercises
npm run dev                # http://localhost:3000
```

Requires a `.env` (or `.env.local`) with:

```bash
DATABASE_URL="postgresql://neurokey:neurokey_dev@localhost:5432/neurokey"
AUTH_SECRET="<any random string>"       # NextAuth session signing secret

# Robokassa billing (subscription checkout / webhook / cancel)
ROBOKASSA_MERCHANT_LOGIN="..."
ROBOKASSA_PASSWORD="..."
ROBOKASSA_IS_TEST="1"                   # omit/0 in production

BILLING_MOCK="1"                        # skip real Robokassa redirect in dev/test
```

## Commands

```bash
npm run dev              # dev server, http://localhost:3000
npm run build             # production build
npm run lint               # eslint

npx vitest run                                 # all unit + integration tests
npx vitest run tests/unit/engine.test.ts        # single test file
npx vitest                                       # watch mode
npx playwright test                              # e2e tests (builds + starts a prod server)

npx prisma migrate dev --name <name>            # create + apply a migration
npx prisma db seed                              # run prisma/seed.ts (90 hand-authored exercises)
npx prisma studio                                # inspect the Postgres DB
```

`npx playwright test` runs against `npm run build && npm run start` rather
than the dev server — see `playwright.config.ts` for why.

## Architecture

See `../CLAUDE.md` in the repo root for the full architecture writeup
(domain logic in `src/lib/`, data model, core concepts). Short version:
monolith Next.js App Router, Postgres via Prisma, adaptive rule engine in
`src/lib/engine.ts`.

## Deployment

Live pilot (Railway, auto-deploys from `main`): https://neurokey-pilot-production.up.railway.app
