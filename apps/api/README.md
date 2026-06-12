# @wordlopol/api

Express REST API for Wordlopol — auth, daily/infinite game modes, Polish word validation.

## Stack

- Express 5, TypeScript
- Prisma 7 + PostgreSQL (`@prisma/adapter-pg`)
- JWT access tokens + httpOnly refresh cookies
- Zod validation

## Scripts

Run from repo root with `pnpm --filter @wordlopol/api <script>` or from this directory with `pnpm <script>`.

| Script            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `dev`             | Start dev server (port 3001)                             |
| `build`           | Compile TypeScript and rewrite `@/` path aliases         |
| `db:migrate`      | Run Prisma migrations                                    |
| `db:import-words` | Import `data/words.txt` into PostgreSQL                  |
| `test`            | Integration tests (Vitest + Supertest, in-process)       |
| `test:coverage`   | Integration tests with v8 coverage report                |
| `test:e2e`        | E2E tests over a real HTTP server on a random local port |
| `test:all`        | Integration + e2e (used in CI)                           |

From monorepo root: `pnpm db:migrate`, `pnpm db:import-words`, `pnpm test:all`.

After pulling schema changes, apply pending migrations before running the API locally:

```bash
pnpm db:migrate   # e.g. InfinitePlayerDay / InfiniteWordUsage (infinite mode)
```

## Testing

Requires Postgres on port **5433** (`docker compose up -d` from repo root). Tests use database `wordlopol_test` (created and migrated automatically on first test run).

```bash
pnpm test              # integration only
pnpm test:coverage     # HTML + lcov in apps/api/coverage/
pnpm test:e2e          # real HTTP (health, auth, daily, infinite)
pnpm test:all          # both suites — same as CI
```

Suite layout: `src/__tests__/` (integration), `src/__e2e__/` (e2e). See [docs/API.md](./docs/API.md#test-coverage-summary) for the full list and Postman checklist.

## API reference

See [docs/API.md](./docs/API.md) for endpoint details, auth flow, Postman setup, security notes, and test commands.

## Health check

```bash
curl http://localhost:3001/health
# { "status": "ok", "database": "connected", "wordCount": <n>, "apiVersion": "v1" }

curl http://localhost:3001/v1/daily/today
```

Requires Postgres via `docker compose up -d` (port **5433**).

## Environment

Copy root `.env.example` to `.env`. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `TZ` — game calendar timezone (default `Europe/Warsaw`; see [docs/API.md](./docs/API.md#calendar-dates--timezone))
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM` — auth emails

## Changelog & releases

User-facing API changes are recorded in [CHANGELOG.md](./CHANGELOG.md).

- **Do not edit** this file in feature PRs — run **Changelog — API** from Actions, then merge the Release PR.
- Version bumps follow PR title: `fix(api):` patch · `feat(api):` minor · `feat(api)!:` major
- See [docs/CONTRIBUTING.md](../../docs/CONTRIBUTING.md#releases-and-changelogs)

## Path aliases

Imports use `@/` for `src/` (same pattern as `apps/web`):

```ts
import { prisma } from '@/lib/prisma.js';
import { authenticate } from '@/middleware/authenticate.js';
```

- **TypeScript** — `tsconfig.json` `paths`
- **Vitest** — `resolve.alias` in `vitest.config.ts` / `vitest.e2e.config.ts`
- **Dev** — `tsx` resolves aliases from `tsconfig.json`
- **Production** — `tsc` then `tsc-alias` rewrites `@/` to relative paths in `dist/`

## Conventions

Commits and PRs: [docs/CONTRIBUTING.md](../../docs/CONTRIBUTING.md) — scope `api`, branch `feat/api-description`.
