# Phase 3 — Frontend Implementation

Build the React + Vite game UI after backend endpoints exist.

## Order of work

### 1. API client

Extend `apps/web/src/api/client.ts`:

- Base URL from env (`VITE_API_URL`)
- Attach access token to requests
- Refresh token flow on 401 (cookie sent automatically with `credentials: 'include'`)
- On refresh failure → redirect to login
- `logout()` → `POST /auth/logout`, clear in-memory access token
- Typed responses using `@wordlopol/shared` DTOs

### 2. Auth pages

| Route              | Component          | API                                                       |
| ------------------ | ------------------ | --------------------------------------------------------- |
| `/register`        | RegisterPage       | POST `/auth/register`                                     |
| `/login`           | LoginPage          | POST `/auth/login`                                        |
| `/verify-email`    | VerifyEmailPage    | POST `/auth/verify-email`                                 |
| `/forgot-password` | ForgotPasswordPage | POST `/auth/forgot-password`                              |
| `/reset-password`  | ResetPasswordPage  | POST `/auth/reset-password`                               |
| `/settings`        | SettingsPage       | change password/email, logout all devices, delete account |

Use TanStack Query for mutations. Auth context for user state.

### 3. Polish keyboard

`apps/web/src/components/PolishKeyboard.tsx`:

- Full Polish layout: ą, ć, ę, ł, ń, ó, ś, ź, ż
- Physical keyboard mapping for Polish input
- Key states: unused, correct, present, absent

### 4. Game board

`apps/web/src/components/GameBoard.tsx`:

- 6 rows × 5 tiles
- Flip animation on guess submit
- Color coding: green (correct), yellow (present), gray (absent)

### 5. Daily mode

`apps/web/src/pages/DailyPage.tsx`:

- Fetch `GET /daily/today`
- Guests: local state only (or client-side evaluation)
- Registered: `POST /daily/guess`, persist progress
- Share result grid (optional, no leaderboard)

### 6. Infinite mode

`apps/web/src/pages/InfinitePage.tsx`:

- Protected route (login + verified email)
- `GET /infinite/next` on load / after win
- Track streak locally; server tracks stats

### 7. Profile page

`apps/web/src/pages/ProfilePage.tsx`:

- `GET /user/profile`
- Show: games played/won (daily + infinite)
- Placeholders for timed stats (Phase 4)

### 8. Routing & layout

```
/           → Home (play daily as guest)
/daily      → Daily game
/infinite   → Infinite (auth required)
/profile    → Stats (auth required)
/login      → Login
/register   → Register
/settings   → Account settings
```

### 9. Styling

- Dark theme default (Wordle-like)
- Responsive layout (mobile-first)
- Accessible focus states and ARIA labels

## Verification

- [ ] Guest can play daily without account
- [ ] Registered user sees stats on profile
- [ ] Infinite blocked for guests
- [ ] Polish diacritics work on keyboard and input
- [ ] Auth flows complete end-to-end
- [ ] Logout clears session; protected routes redirect to login
- [ ] Logout-all works from settings

## Next

[05-future-features.md](./05-future-features.md) when v1 ships.
