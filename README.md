# Wordlopol

Polish Wordle-style word game. Guess 5-letter Polish words — diacritics matter (ą, ć, ę, ł, ń, ó, ś, ź, ż).

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) — commits (`feat(api): ...`), branches, PRs, releases, Husky hooks, and CI.

Quick checks: `pnpm validate` · `pnpm test:all` (Postgres on 5433). **1.0 scope & QA:** [docs/V1.md](./docs/V1.md).

## Monorepo structure

```
wordlopol/
├── apps/
│   ├── api/          # Express + Prisma + PostgreSQL
│   └── web/          # React + Vite
├── packages/
│   ├── shared/       # Game logic & shared types
│   ├── eslint-config/
│   └── tsconfig/
└── data/
    └── words.txt     # Polish word list (you provide)
```

Future: `apps/mobile/` (React Native + Expo).

## Prerequisites

- Node.js 22+
- pnpm 11+ (`corepack enable && corepack prepare pnpm@11.5.2 --activate`)
- Docker (local Postgres)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Environment
cp .env.example .env
# Edit .env with JWT secrets and Resend key when ready

# 3. Start Postgres (port 5433 — avoids conflict with local Postgres on 5432)
docker compose up -d

# 4. Database
pnpm db:migrate
pnpm db:import-words

# 6. Run dev servers
pnpm dev
```

- API probe: http://localhost:3001/health → `{ "status": "ok", "database": "connected", "wordCount": <n>, "apiVersion": "v1" }`
- API app routes: `http://localhost:3001/v1/...` (web uses `/api/v1/...` via Vite proxy)
- Web: http://localhost:5173

## Word list

Place 5-letter Polish words in `data/words.txt` (one per line), then:

```bash
pnpm db:import-words
```

## Resend (email)

Auth flows (verify email, password reset, change email) use [Resend](https://resend.com).

**Free tier**: 3,000 emails/month, 100/day — enough for a hobby project.

1. Sign up at https://resend.com
2. Add and verify a sending domain
3. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env`

## Scripts

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `pnpm dev`             | Start API + web in dev mode                |
| `pnpm build`           | Build all packages                         |
| `pnpm lint`            | ESLint across monorepo                     |
| `pnpm typecheck`       | TypeScript check                           |
| `pnpm format`          | Prettier format (write)                    |
| `pnpm format:check`    | Prettier check (CI / pre-push)             |
| `pnpm validate`        | Branch name + format + lint + typecheck    |
| `pnpm validate:branch` | Check current branch name                  |
| `pnpm test`            | API integration tests (Vitest + Supertest) |
| `pnpm test:coverage`   | API tests with coverage report             |
| `pnpm test:e2e`        | API e2e tests over real HTTP               |
| `pnpm test:all`        | Integration + e2e (same as CI)             |
| `pnpm db:migrate`      | Run Prisma migrations                      |
| `pnpm db:import-words` | Import words from `data/words.txt`         |

## Docs

| Document                                       | Description                     |
| ---------------------------------------------- | ------------------------------- |
| [docs/V1.md](./docs/V1.md)                     | 1.0 scope and pre-release QA    |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design                   |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Commits, PRs, releases, CI      |
| [docs/SUPPLY_CHAIN.md](./docs/SUPPLY_CHAIN.md) | pnpm supply-chain policies      |
| [apps/api/docs/API.md](./apps/api/docs/API.md) | API endpoints, Postman, testing |
| [CHANGELOG.md](./CHANGELOG.md)                 | Repo-level changelog            |

## Tech stack

- **Monorepo**: pnpm workspaces + Turborepo
- **API**: Express, Prisma 7, PostgreSQL (`@prisma/adapter-pg`)
- **Auth**: Email + password, JWT access tokens + httpOnly refresh cookies (not OAuth)
- **Web**: React, Vite, TypeScript
- **Email**: Resend (verify, reset, change email)
- **Tooling**: ESLint, Prettier, Husky, GitHub Actions

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system overview and auth summary.
