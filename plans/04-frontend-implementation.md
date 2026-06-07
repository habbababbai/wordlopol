# Phase 3 — Frontend Implementation

Build the React + Vite game UI after backend endpoints exist.

**Design:** [Wordlopol — Figma Make](https://www.figma.com/make/RggardTz2oWCfly04e4HdX/Wordlopol) — tokens, components, and screen layouts live there. Port into `apps/web`; use React Router (not the prototype’s screen state).

Reference screens in Figma Make: `HomeScreen`, `Header`, `GameScreen`, `AuthScreens`, `ProfileScreen`, `SettingsScreen`.

## Progress

| Step                         | Status          |
| ---------------------------- | --------------- |
| 1. Design foundation         | done            |
| 2. App shell & routing       | done (commit 6) |
| 3. Test setup                | next            |
| 4. i18n                      | planned         |
| 5. Home page (Figma, static) | planned         |
| 6. API client & auth context | planned         |
| 7. Auth pages                | planned         |
| 8. Game components           | planned         |
| 9. Game pages                | planned         |
| 10. Polish & accessibility   | planned         |

## Order of work

### 1. Design foundation ✅

- Tailwind v4 + CSS variables (`apps/web/src/styles/`)
- Light / dark theme (`ThemeContext`, default dark)
- UI primitives per Figma design system screen (tiles, buttons, badges, toasts, loaders, inputs)
- `/dev/ui` gallery in development only

### 2. App shell & routing ✅

```
/           → Home (landing — see step 5)
/daily      → Daily game
/infinite   → Infinite (auth + verified email)
/profile    → Stats (auth required)
/login      → Login
/register   → Register
/verify-email, /forgot-password, /reset-password
/settings   → Account settings
```

`AppLayout` — header, main, footer (minimal shell today; align closer to Figma `Header` when building the home page or in a small follow-up).

### 3. Test setup

Add Vitest + Testing Library to `apps/web` (mirror API conventions):

- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- `vitest.config.ts` — `environment: 'jsdom'`, `@/` or relative imports, setup file for jest-dom matchers
- Scripts: `test`, `test:watch`, `test:coverage` (same names as `apps/api` so root `pnpm test` / turbo picks them up)
- First tests (smoke, not exhaustive):
  - `AppLayout` renders nav links for main routes
  - route stub pages render title without crashing
- No Playwright in v1 unless a later commit needs browser e2e; component/route tests first

### 4. i18n

Stop hardcoding UI strings; Polish is default, English scaffolded for later.

- **Library:** `react-i18next` + `i18next`
- **Files:** `apps/web/src/locales/pl.json`, `en.json`; `apps/web/src/i18n.ts` init
- **Default locale:** `pl` (detect from `localStorage` / `navigator`, fallback `pl`)
- **Usage:** `useTranslation()` in pages and layout; no string literals in JSX for user-visible copy
- **Scope for first pass:** shell nav, home page, auth labels, common actions (save, cancel, errors)
- **Language switcher:** optional in settings first; header toggle deferred until settings page exists
- Migrate existing Polish strings (Home, AppLayout, stubs) when i18n lands — do not add new hardcoded copy after this step

### 5. Home page (Figma, static)

Port [Figma `HomeScreen`](https://www.figma.com/make/RggardTz2oWCfly04e4HdX/Wordlopol) to `Home.tsx` — **presentation + navigation only**, no game API yet.

**Include (match Figma):**

- Hero: wordmark + `PL` badge, tagline, animated demo tiles (`SŁOWO` states)
- Primary CTA → `/daily`; secondary → `/infinite` (or `/login` when guest)
- Guest prompt → `/register`
- Three feature cards (daily, infinite, stats) with router `Link`s
- “Jak grać?” section with tile examples and numbered rules

**Exclude for this step:**

- Daily/infinite gameplay, guess API, share modal
- Real auth state (use `isLoggedIn = false` or optional prop until `AuthContext` exists)
- Health-check debug line (remove from production home; API status not part of Figma)

**Optional same PR or tiny follow-up:** `AmbientBackground` from Figma if it matches tokens; refine `AppLayout` header (sticky, mobile menu, logo + PL badge) per Figma `Header`.

All copy via i18n keys from step 4.

### 6. API client

Extend `apps/web/src/api/client.ts`:

- Base URL from env (`VITE_API_URL`)
- Attach access token to requests
- Refresh token flow on 401 (`credentials: 'include'`)
- On refresh failure → redirect to login
- `logout()` → `POST /auth/logout`, clear in-memory access token
- Typed responses using `@wordlopol/shared` DTOs

**Local dev without Resend:** API logs verification/reset emails to the terminal and returns `devToken` in JSON when `NODE_ENV=development`. Frontend can use normal endpoints; optional dev-only UI to surface `devToken` after register is not required for v1.

### 7. Auth pages

| Route              | Component          | API                                                       |
| ------------------ | ------------------ | --------------------------------------------------------- |
| `/register`        | RegisterPage       | POST `/auth/register`                                     |
| `/login`           | LoginPage          | POST `/auth/login`                                        |
| `/verify-email`    | VerifyEmailPage    | POST `/auth/verify-email`                                 |
| `/forgot-password` | ForgotPasswordPage | POST `/auth/forgot-password`                              |
| `/reset-password`  | ResetPasswordPage  | POST `/auth/reset-password`                               |
| `/settings`        | SettingsPage       | change password/email, logout all devices, delete account |

TanStack Query for mutations. `AuthContext` for user state. `ProtectedRoute` + verified-email guard for infinite.

Wire home page CTAs to real auth state (`isLoggedIn`, locked infinite/stats cards).

### 8. Game components

`PolishKeyboard.tsx` — Polish layout, physical keyboard mapping, key states.

`GameBoard.tsx` — 6 × 5 tiles, flip animation, share modal (optional).

### 9. Game pages

**Daily** — `GET /daily/today`, `POST /daily/guess` (registered). Guests: local state.

**Infinite** — `GET /infinite/next` (protected, verified).

**Profile** — `GET /user/profile`, stats; timed placeholders for Phase 4.

### 10. Polish & accessibility

Responsive (mobile-first), focus-visible, ARIA, `prefers-reduced-motion`.

## Atomic commits

| #   | Status | Suggested message                                         |
| --- | ------ | --------------------------------------------------------- |
| 1   | done   | `docs(web): restructure frontend plan with design system` |
| 2   | done   | `feat(web): add design tokens and theme switching`        |
| 3   | done   | `feat(web): add form primitives`                          |
| 4   | done   | `feat(web): add tile badge and loader components`         |
| 5   | done   | `feat(web): add toast notifications and dev ui page`      |
| 6   | done   | `feat(web): add app layout and route stubs`               |
| 7   | next   | `feat(web): add vitest and testing library setup`         |
| 8   |        | `feat(web): add i18n with polish and english locales`     |
| 9   |        | `feat(web): add figma home page with static navigation`   |
| 10  |        | `feat(web): add api client and auth context`              |
| 11  |        | `feat(web): add auth pages`                               |
| 12  |        | `feat(web): add game board and polish keyboard`           |
| 13  |        | `feat(web): add game and profile pages`                   |

Commit 9 may split into `feat(web): add ambient background` or header polish if the diff grows too large — prefer two small PRs over one oversized commit.

## Verification

- [ ] Design system matches Figma; theme persists across reload
- [ ] `pnpm --filter @wordlopol/web test` passes in CI
- [ ] Home page matches Figma layout; all CTAs navigate (no gameplay yet)
- [ ] UI strings come from i18n; switching to `en` shows English where translated
- [ ] Guest can play daily without account
- [ ] Registered user sees stats on profile
- [ ] Infinite blocked for guests / unverified users
- [ ] Polish diacritics work on keyboard and input
- [ ] Auth flows complete end-to-end (works locally without Resend via `devToken` / terminal logs)
- [ ] Logout clears session; protected routes redirect to login
- [ ] Logout-all works from settings

## Next

[05-future-features.md](./05-future-features.md) when v1 ships.
