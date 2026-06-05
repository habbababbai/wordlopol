# Phase 1 — Initial Repo Setup

Scaffold the monorepo with tooling and placeholders. No game logic yet.

## Prerequisites

- Node.js 22+
- pnpm 11+ (`corepack enable && corepack prepare pnpm@11.5.2 --activate`)
- Docker (for local Postgres)
- Git

## Step 1 — Clone and install

```bash
cd wordlopol
pnpm install
```

## Step 2 — Environment

```bash
cp .env.example .env
# Edit .env with your secrets (JWT secrets, Resend API key when ready)
```

Word list lives in `data/words.txt` (one word per line, 5-letter Polish words).

## Step 3 — Start Postgres

> Postgres runs on **port 5433** in Docker (5432 is often taken by a local install).

```bash
docker compose up -d
```

Verify Postgres is running:

```bash
docker compose ps
```

## Step 4 — Database (after Phase 2 migration exists)

```bash
pnpm db:migrate
pnpm db:import-words
```

> During Phase 1, migrations may not exist yet. Skip until Phase 2.

## Step 5 — Development

```bash
pnpm dev
```

Expected:

- API: http://localhost:3001/health → `{ "status": "ok", "database": "connected", "wordCount": 4062 }`
- Web: http://localhost:5173 → placeholder home page

## Step 6 — Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Step 7 — Git hooks

Husky runs ESLint + Prettier on staged files via lint-staged. Test by staging a file with a lint error — commit should fail.

## Step 8 — CI

Push to GitHub. `.github/workflows/ci.yml` runs lint, typecheck, and build on every push/PR to `main`.

## Verification checklist

- [ ] `pnpm install` succeeds
- [ ] `pnpm dev` starts API and web
- [ ] `GET /health` returns 200
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` produces `apps/api/dist` and `apps/web/dist`
- [ ] Husky blocks bad commits
- [ ] `docker compose up` starts Postgres
- [ ] `data/words.txt` documented and ready for import

## Next

Proceed to [03-backend-implementation.md](./03-backend-implementation.md).
