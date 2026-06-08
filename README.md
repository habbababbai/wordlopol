# Wordlopol

Polish Wordle-style word game. Guess 5-letter Polish words — diacritics matter (ą, ć, ę, ł, ń, ó, ś, ź, ż).

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) — commits (`feat(api): ...`), branches, PRs, releases, Husky hooks, and CI.

Quick checks: `pnpm validate` · `pnpm test:all` (Postgres on 5433). Active plan: [plans/04-frontend-implementation.md](./plans/04-frontend-implementation.md).

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
├── data/
│   └── words.txt     # Polish word list (you provide)
└── plans/            # Step-by-step implementation guides
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

- API: http://localhost:3001/health → `{ "status": "ok", "database": "connected", "wordCount": 4062 }`
- Web: http://localhost:5173

## Word list format

Place words in `data/words.txt` — one word per line. Only 5-letter words with Polish diacritics are imported.

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

| Document                                                                     | Description                     |
| ---------------------------------------------------------------------------- | ------------------------------- |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)                               | Commits, PRs, releases, CI      |
| [CHANGELOG.md](./CHANGELOG.md)                                               | Repo-level changelog            |
| [apps/api/docs/API.md](./apps/api/docs/API.md)                               | API endpoints, Postman, testing |
| [plans/02-architecture.md](./plans/02-architecture.md)                       | System design reference         |
| [plans/04-frontend-implementation.md](./plans/04-frontend-implementation.md) | Active frontend plan            |
| [plans/05-future-features.md](./plans/05-future-features.md)                 | Timed mode, multiplayer, mobile |

## Roadmap

| Phase  | Scope                                                                             |
| ------ | --------------------------------------------------------------------------------- |
| **v1** | Daily word (guests + registered), infinite mode (registered), auth, profile stats |
| **v2** | Timed mode (5 min, max words)                                                     |
| **v3** | Multiplayer lobbies (up to 4 players)                                             |
| **v4** | React Native + Expo app                                                           |

No leaderboards — stats visible only on your own profile.

## Tech stack

- **Monorepo**: pnpm workspaces + Turborepo
- **API**: Express, Prisma 7, PostgreSQL (`@prisma/adapter-pg`)
- **Auth**: Email + password, JWT access tokens + httpOnly refresh cookies (not OAuth)
- **Web**: React, Vite, TypeScript
- **Email**: Resend (verify, reset, change email)
- **Tooling**: ESLint, Prettier, Husky, GitHub Actions

See [Architecture — token security & logout](./plans/02-architecture.md#token-security) for auth design details.
