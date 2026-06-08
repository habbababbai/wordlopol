# Frontend implementation (v1)

React + Vite game UI. Backend (auth, daily, infinite) is **done**.

**Design:** [Wordlopol — Figma Make](https://www.figma.com/make/RggardTz2oWCfly04e4HdX/Wordlopol) — port tokens and screens into `apps/web` with React Router.

## Progress

| Area                                                        | Status   |
| ----------------------------------------------------------- | -------- |
| Design foundation (tokens, theme, UI primitives, `/dev/ui`) | done     |
| App shell & routing                                         | done     |
| Vitest + Testing Library (`src/__tests__/`)                 | done     |
| i18n (Polish only, `locales/pl.json`)                       | done     |
| Home page (Figma layout, static navigation)                 | done     |
| API client + `AuthProvider` (`@wordlopol/shared` types)     | done     |
| Auth pages (forms, guards, settings)                        | **next** |
| Game board + Polish keyboard                                | planned  |
| Daily / infinite / profile gameplay                         | planned  |
| Responsive polish & accessibility                           | planned  |

## Remaining work (by PR)

Each row is a **PR scope** — use multiple commits inside the PR as needed. See [CONTRIBUTING.md](../docs/CONTRIBUTING.md).

### PR: Auth pages

Wire stub routes into real flows:

| Route                                                  | Work                                              |
| ------------------------------------------------------ | ------------------------------------------------- |
| `/login`, `/register`                                  | Forms, validation, API mutations                  |
| `/verify-email`, `/forgot-password`, `/reset-password` | Token/query handling                              |
| `/settings`                                            | Change password/email, logout-all, delete account |

- `ProtectedRoute` for `/profile`, `/infinite`, `/settings`
- Verified-email guard for infinite
- Wire `Home` CTAs to `useAuth()` (replace `isLoggedIn = false`)
- TanStack Query for mutations where helpful

**Local dev without Resend:** API returns `devToken` in development; terminal logs show verification links.

### PR: Game components

- `GameBoard.tsx` — 6×5 tiles, flip animation
- `PolishKeyboard.tsx` — layout, physical keys, letter states

### PR: Game pages

- **Daily** — `GET /daily/today`, `POST /daily/guess`; guest vs registered behaviour
- **Infinite** — `GET /infinite/next`, `POST /infinite/guess` (auth + verified)
- **Profile** — `GET /user/profile`, stats display

### PR: Polish & accessibility

Mobile-first layout, focus-visible, ARIA, `prefers-reduced-motion`.

## Conventions

- **Tests:** `apps/web/src/__tests__/` (mirror API layout); support files in `src/test/`
- **Copy:** Polish via `react-i18next`; add `pl.json` keys — no hardcoded UI strings
- **Types:** import API DTOs from `@wordlopol/shared`

## Verification (v1 ship)

- [ ] `pnpm --filter @wordlopol/web test` passes in CI
- [ ] Guest can play daily without account
- [ ] Registered user sees stats on profile
- [ ] Infinite blocked for guests / unverified users
- [ ] Polish diacritics on keyboard and input
- [ ] Auth flows end-to-end (works without Resend via `devToken`)
- [ ] Logout clears session; protected routes redirect to login

## Next

[05-future-features.md](./05-future-features.md) after v1 ships.
