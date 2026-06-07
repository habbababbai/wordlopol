# Phase 3 — Frontend Implementation

Build the React + Vite game UI after backend endpoints exist.

**Design:** [Wordlopol — Figma Make](https://www.figma.com/make/RggardTz2oWCfly04e4HdX/Wordlopol) — tokens, components, and screen layouts live there. Port into `apps/web`; use React Router (not the prototype’s screen state).

## Order of work

### 1. Design foundation

- Tailwind v4 + CSS variables (`apps/web/src/styles/`)
- Light / dark theme (`ThemeContext`, default dark)
- UI primitives per Figma design system screen (tiles, buttons, badges, toasts, loaders, inputs)
- `/dev/ui` gallery in development only

### 2. App shell & routing

```
/           → Home (play daily as guest)
/daily      → Daily game
/infinite   → Infinite (auth + verified email)
/profile    → Stats (auth required)
/login      → Login
/register   → Register
/verify-email, /forgot-password, /reset-password
/settings   → Account settings
```

`AppLayout` — header, main, footer.

### 3. API client

Extend `apps/web/src/api/client.ts`:

- Base URL from env (`VITE_API_URL`)
- Attach access token to requests
- Refresh token flow on 401 (`credentials: 'include'`)
- On refresh failure → redirect to login
- `logout()` → `POST /auth/logout`, clear in-memory access token
- Typed responses using `@wordlopol/shared` DTOs

### 4. Auth pages

| Route              | Component          | API                                                       |
| ------------------ | ------------------ | --------------------------------------------------------- |
| `/register`        | RegisterPage       | POST `/auth/register`                                     |
| `/login`           | LoginPage          | POST `/auth/login`                                        |
| `/verify-email`    | VerifyEmailPage    | POST `/auth/verify-email`                                 |
| `/forgot-password` | ForgotPasswordPage | POST `/auth/forgot-password`                              |
| `/reset-password`  | ResetPasswordPage  | POST `/auth/reset-password`                               |
| `/settings`        | SettingsPage       | change password/email, logout all devices, delete account |

TanStack Query for mutations. `AuthContext` for user state. `ProtectedRoute` + verified-email guard for infinite.

### 5. Game components

`PolishKeyboard.tsx` — Polish layout, physical keyboard mapping, key states.

`GameBoard.tsx` — 6 × 5 tiles, flip animation, share modal (optional).

### 6. Game pages

**Daily** — `GET /daily/today`, `POST /daily/guess` (registered). Guests: local state.

**Infinite** — `GET /infinite/next` (protected, verified).

**Profile** — `GET /user/profile`, stats; timed placeholders for Phase 4.

### 7. Polish & accessibility

Responsive (mobile-first), focus-visible, ARIA, `prefers-reduced-motion`.

## Atomic commits

| #   | Suggested message                                         |
| --- | --------------------------------------------------------- |
| 1   | `docs(web): restructure frontend plan with design system` |
| 2   | `feat(web): add design tokens and theme switching`        |
| 3   | `feat(web): add form primitives`                          |
| 4   | `feat(web): add tile badge and loader components`         |
| 5   | `feat(web): add toast notifications and dev ui page`      |
| 6   | `feat(web): add app layout and route stubs`               |
| 7   | `feat(web): add api client and auth context`              |
| 8   | `feat(web): add auth pages`                               |
| 9   | `feat(web): add game board and polish keyboard`           |
| 10  | `feat(web): add game and profile pages`                   |

## Verification

- [ ] Design system matches Figma; theme persists across reload
- [ ] Guest can play daily without account
- [ ] Registered user sees stats on profile
- [ ] Infinite blocked for guests / unverified users
- [ ] Polish diacritics work on keyboard and input
- [ ] Auth flows complete end-to-end
- [ ] Logout clears session; protected routes redirect to login
- [ ] Logout-all works from settings

## Next

[05-future-features.md](./05-future-features.md) when v1 ships.
