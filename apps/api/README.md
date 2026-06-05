# @wordlopol/api

Express REST API for Wordlopol — auth, daily/infinite game modes, Polish word validation.

## Stack

- Express 5, TypeScript
- Prisma 7 + PostgreSQL (`@prisma/adapter-pg`)
- JWT access tokens + httpOnly refresh cookies
- Zod validation

## Scripts

Run from repo root with `pnpm --filter @wordlopol/api <script>` or from this directory with `pnpm <script>`.

| Script            | Description                             |
| ----------------- | --------------------------------------- |
| `dev`             | Start dev server (port 3001)            |
| `build`           | Compile TypeScript                      |
| `db:migrate`      | Run Prisma migrations                   |
| `db:import-words` | Import `data/words.txt` into PostgreSQL |

From monorepo root: `pnpm db:migrate`, `pnpm db:import-words`.

## API reference

See [docs/API.md](./docs/API.md) for endpoint details, auth flow, Postman setup, and security notes.

## Health check

```bash
curl http://localhost:3001/health
# { "status": "ok", "database": "connected", "wordCount": 4062 }
```

Requires Postgres via `docker compose up -d` (port **5433**).

## Environment

Copy root `.env.example` to `.env`. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM` — auth emails

## Changelog & releases

User-facing API changes are recorded in [CHANGELOG.md](./CHANGELOG.md).

- **Do not edit** this file in feature PRs — release-please updates it via a Release PR after merge.
- Version bumps follow PR title: `fix(api):` patch · `feat(api):` minor · `feat(api)!:` major
- See [docs/CHANGELOG_AUTOMATION.md](../../docs/CHANGELOG_AUTOMATION.md)

## Conventions

Commits and PRs: [COMMIT_CONVENTIONS.md](../../COMMIT_CONVENTIONS.md) — scope `api`, branch `feat/api-description`.
