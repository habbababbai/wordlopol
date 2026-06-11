# @wordlopol/web

React SPA for Wordlopol — daily and infinite Polish Wordle-style play, auth, profile, and settings.

## Stack

- React 19, Vite, TypeScript
- Tailwind CSS 4, Radix Slot
- TanStack Query (server state), Zustand (client UI state)
- react-i18next (Polish only for v1)
- Vitest + Testing Library

## Dev

From repo root (API + web together):

```bash
pnpm dev
```

Web: http://localhost:5173 · API client base `/api/v1` (Vite proxies `/api` → http://localhost:3001)

From this package only: `pnpm dev`

Requires the API running with Postgres (`docker compose up -d`, `pnpm db:migrate` — see [root README](../../README.md)).

## Scripts

Run with `pnpm --filter @wordlopol/web <script>` or from this directory.

| Script          | Description              |
| --------------- | ------------------------ |
| `dev`           | Vite dev server (5173)   |
| `build`         | Production build         |
| `preview`       | Preview production build |
| `test`          | Vitest unit tests        |
| `test:watch`    | Vitest watch mode        |
| `test:coverage` | Coverage report          |
| `lint`          | ESLint                   |
| `typecheck`     | `tsc --noEmit`           |

## Layout

```
src/
├── api/          # HTTP client, CSRF, tokens
├── components/   # UI, game board, auth, layout
├── hooks/        # Queries, mutations, keyboard
├── pages/        # Route screens
├── locales/      # pl.json
└── __tests__/    # Vitest suites
```

Dev-only UI primitives: `/dev/ui`

## Testing

```bash
pnpm test
```

Tests mock the API; no database required. Helpers: `src/test/render.tsx`, `src/test/setup.ts`.

## Environment

Optional `VITE_API_URL` — defaults to `/api` (Vite proxy in dev). Set for a non-proxied API base in other deployments.

## v1 status

See [docs/V1.md](../../docs/V1.md).

## Conventions

Commits and PRs: [docs/CONTRIBUTING.md](../../docs/CONTRIBUTING.md) — scope `web`, branch `feat/web-description`.
