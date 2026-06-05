# Wordlopol API — endpoints & testing

Base URL (local): `http://localhost:3001`

All JSON request/response bodies unless noted. Errors: `{ "error": "<message>" }`.

---

## Auth flow overview

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant Email

    Note over Client,Email: Registration
    Client->>API: POST /auth/register
    API->>DB: create User + verification token hash
    API->>Email: send verification link
    Client->>API: POST /auth/verify-email { token }
    API->>DB: set emailVerifiedAt

    Note over Client,DB: Login & sessions
    Client->>API: POST /auth/login
    API-->>Client: accessToken + user (JSON) + refresh_token (httpOnly cookie)
    Client->>API: Bearer accessToken on protected routes
    Client->>API: POST /auth/refresh (cookie auto-sent)
    API-->>Client: new accessToken + rotated refresh cookie

    Note over Client,DB: Logout
    Client->>API: POST /auth/logout (cookie)
    API->>DB: delete refresh token hash
    Client->>API: POST /auth/logout-all (Bearer token)
    API->>DB: delete all refresh tokens for user
```

### Token model

| Token          | Storage                         | Lifetime | Used for                             |
| -------------- | ------------------------------- | -------- | ------------------------------------ |
| Access JWT     | Client memory / Postman env     | 15 min   | `Authorization: Bearer <token>`      |
| Refresh token  | httpOnly cookie `refresh_token` | 7 days   | `POST /auth/refresh`, `/auth/logout` |
| Email verify   | Email link → body token         | 24 h     | `POST /auth/verify-email`            |
| Password reset | Email link → body token         | 1 h      | `POST /auth/reset-password`          |
| Email change   | Email link → body token (JWT)   | 24 h     | `POST /auth/verify-email`            |

Refresh tokens are stored as **SHA-256 hashes** in the database (never plaintext). Each refresh **rotates** the token (old one invalidated).

---

## Endpoints

### Health

| Method | Path      | Auth | Description                             |
| ------ | --------- | ---- | --------------------------------------- |
| GET    | `/health` | —    | DB connectivity + dictionary word count |

**200**

```json
{ "status": "ok", "database": "connected", "wordCount": 4062 }
```

**503** — database unreachable

```json
{ "status": "degraded", "database": "disconnected" }
```

---

### Auth — public

| Method | Path                        | Body                               | Success                                                       |
| ------ | --------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| POST   | `/auth/register`            | `{ email, password, displayName }` | **201** `{ message }`                                         |
| POST   | `/auth/verify-email`        | `{ token }`                        | **200** `{ message }`                                         |
| POST   | `/auth/login`               | `{ email, password }`              | **200** `{ accessToken, user }` + `Set-Cookie: refresh_token` |
| POST   | `/auth/resend-verification` | `{ email }`                        | **200** `{ message }` (always same text)                      |
| POST   | `/auth/forgot-password`     | `{ email }`                        | **200** `{ message }` (always same text)                      |
| POST   | `/auth/reset-password`      | `{ token, password }`              | **200** `{ message }`                                         |

Rate-limited (15 min window): `register` (5), `login` (10), `resend-verification` (5), `forgot-password` (5) per IP.

**Validation**

- `password` min 8 chars on register / reset
- `email` must be valid format
- `displayName` required, 1–50 chars after trim

**login response**

```json
{
  "accessToken": "...",
  "user": {
    "id": "...",
    "email": "player@example.com",
    "displayName": "Player",
    "emailVerified": true
  }
}
```

**verify-email responses**

- `{ "message": "Email verified" }` — initial registration
- `{ "message": "Email changed" }` — email-change confirmation (same endpoint)

---

### Auth — refresh cookie

These endpoints read the `refresh_token` cookie (path `/auth`). No Bearer token required.

| Method | Path            | Success                                              |
| ------ | --------------- | ---------------------------------------------------- |
| POST   | `/auth/refresh` | **200** `{ accessToken }` + new cookie               |
| POST   | `/auth/logout`  | **200** `{ message: "Logged out" }` + cookie cleared |

---

### Auth — Bearer token required

Send header: `Authorization: Bearer <accessToken>`

| Method | Path                        | Body                               | Success                                |
| ------ | --------------------------- | ---------------------------------- | -------------------------------------- |
| POST   | `/auth/logout-all`          | —                                  | **200** `{ message }` + cookie cleared |
| PATCH  | `/auth/change-display-name` | `{ displayName }`                  | **200** `{ user }`                     |
| PATCH  | `/auth/change-password`     | `{ currentPassword, newPassword }` | **200** `{ message }`                  |
| PATCH  | `/auth/change-email`        | `{ newEmail }`                     | **200** `{ message }`                  |
| DELETE | `/auth/account`             | `{ password }`                     | **200** `{ message }`                  |

`change-password`, `logout-all`, and `account` delete also revoke refresh sessions server-side.

---

## Common error codes

| Status | When                                                 |
| ------ | ---------------------------------------------------- |
| 400    | Invalid body / expired or invalid token              |
| 401    | Missing or invalid Bearer / refresh token / password |
| 403    | Email not verified (login)                           |
| 404    | User not found                                       |
| 409    | Email already registered                             |
| 429    | Rate limit exceeded on auth endpoints                |
| 503    | Health — DB down                                     |

---

## Postman setup guide

### 1. Prerequisites

```bash
docker compose up -d
pnpm db:migrate
pnpm db:import-words   # optional for health wordCount
pnpm --filter @wordlopol/api dev
```

API runs at `http://localhost:3001`. Keep the **dev server terminal visible** — without Resend, all email tokens are logged there.

### 2. Environment variables

Create environment **Wordlopol Local**:

| Variable             | Initial value                                          | Set by                                                            | Used for                         |
| -------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------- |
| `base_url`           | `http://localhost:3001`                                | you                                                               | all requests                     |
| `display_name`       | `Player`                                               | you                                                               | register                         |
| `email`              | `player@example.com` (use a unique email per full run) | you / step 12 script                                              | register, login, forgot-password |
| `new_email`          | `new-player@example.com` (unique per run)              | you                                                               | change-email                     |
| `password`           | `secure-password`                                      | you; updated in steps 8–9 scripts                                 | login, change-password, delete   |
| `access_token`       | _(empty)_                                              | **Login** Tests script (step 3); optional refresh script (step 4) | Bearer on steps 6, 9, 10, 12     |
| `verify_token`       | _(empty)_                                              | **you — copy from API server log** after register                 | step 2 body                      |
| `reset_token`        | _(empty)_                                              | **you — copy from API server log** after forgot-password          | step 8 body                      |
| `email_change_token` | _(empty)_                                              | **you — copy from API server log** after change-email             | step 12 body                     |

**Tip:** use `player-{{$timestamp}}@example.com` for `email` and `new_email` so each run starts fresh.

### 3. Collection settings

| Setting       | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Cookie jar    | **Enabled** (default) — login sets `refresh_token` automatically |
| Cookie path   | `/auth` — sent on all `{{base_url}}/auth/*` requests             |
| Bearer routes | Authorization → **Bearer Token** → `{{access_token}}`            |
| Content-Type  | `application/json` on all POST/PATCH/DELETE with body            |

### 4. Where tokens come from (not in API responses)

`forgot-password`, `register`, and `change-email` return only generic messages. Tokens appear in the **API dev terminal** when `RESEND_API_KEY` is unset:

```
[email] To: player@example.com
Subject: ...
<p>...<a href="http://localhost:5173/...?token=abc123...">...</a></p>
```

Copy only the **`token=` query value** (64-char hex) into the matching environment variable:

| After request                | Log link contains          | Paste into env var   | Used in                              |
| ---------------------------- | -------------------------- | -------------------- | ------------------------------------ |
| POST `/auth/register`        | `verify-email?token=...`   | `verify_token`       | POST `/auth/verify-email` (step 2)   |
| POST `/auth/forgot-password` | `reset-password?token=...` | `reset_token`        | POST `/auth/reset-password` (step 8) |
| PATCH `/auth/change-email`   | `verify-email?token=...`   | `email_change_token` | POST `/auth/verify-email` (step 12)  |

With Resend configured, use the same token from the email link instead of the log.

### 5. Minimal collection (13 auth requests)

Run in order in one session (< 15 min so `access_token` from login stays valid).

| #   | Method | Path                        | Auth   | Body                                                                                      | After success                                     |
| --- | ------ | --------------------------- | ------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | POST   | `/auth/register`            | —      | `{ "email": "{{email}}", "password": "{{password}}", "displayName": "{{display_name}}" }` | Copy `verify_token` from log                      |
| 2   | POST   | `/auth/verify-email`        | —      | `{ "token": "{{verify_token}}" }`                                                         | Expect `"Email verified"`                         |
| 3   | POST   | `/auth/login`               | —      | `{ "email": "{{email}}", "password": "{{password}}" }`                                    | Saves `access_token`; sets cookie; returns `user` |
| 4   | POST   | `/auth/refresh`             | Cookie | _(none)_                                                                                  | Optional: update `access_token`                   |
| 5   | POST   | `/auth/logout`              | Cookie | _(none)_                                                                                  | Cookie cleared                                    |
| 6   | POST   | `/auth/logout-all`          | Bearer | _(none)_                                                                                  | Uses `access_token` from step 3                   |
| 7   | POST   | `/auth/forgot-password`     | —      | `{ "email": "{{email}}" }`                                                                | Copy `reset_token` from log                       |
| 8   | POST   | `/auth/reset-password`      | —      | `{ "token": "{{reset_token}}", "password": "new-password" }`                              | Set `password` → `new-password`                   |
| 9   | PATCH  | `/auth/change-display-name` | Bearer | `{ "displayName": "Updated Player" }`                                                     | Returns updated `user`                            |
| 10  | PATCH  | `/auth/change-password`     | Bearer | `{ "currentPassword": "{{password}}", "newPassword": "changed-password" }`                | Set `password` → `changed-password`               |
| 11  | PATCH  | `/auth/change-email`        | Bearer | `{ "newEmail": "{{new_email}}" }`                                                         | Copy `email_change_token` from log                |
| 12  | POST   | `/auth/verify-email`        | —      | `{ "token": "{{email_change_token}}" }`                                                   | Expect `"Email changed"`                          |
| 13  | DELETE | `/auth/account`             | Bearer | `{ "password": "{{password}}" }`                                                          | `password` = `changed-password`                   |

**Optional:** POST `/auth/resend-verification` with `{ "email": "{{email}}" }` if step 1 log has no token.

**Health (you already have):** GET `{{base_url}}/health`

### 6. Tests scripts

**Login (step 3)** — saves Bearer token:

```javascript
pm.test('200', () => pm.response.to.have.status(200));
const { accessToken, user } = pm.response.json();
pm.environment.set('access_token', accessToken);
pm.test('user profile', () => {
  pm.expect(user.email).to.eql(pm.environment.get('email'));
  pm.expect(user.displayName).to.be.a('string').and.not.empty;
  pm.expect(user.emailVerified).to.be.true;
});
pm.test('refresh cookie', () => pm.expect(pm.cookies.has('refresh_token')).to.be.true);
```

**Reset password (step 8):**

```javascript
pm.test('200', () => pm.response.to.have.status(200));
pm.environment.set('password', 'new-password');
```

**Change password (step 10):**

```javascript
pm.test('200', () => pm.response.to.have.status(200));
pm.environment.set('password', 'changed-password');
```

**Verify email change (step 12):**

```javascript
pm.test('200', () => pm.response.to.have.status(200));
pm.environment.set('email', pm.environment.get('new_email'));
```

### 7. Postman tips

| Topic              | Note                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Auth types         | **None** = public · **Cookie** = `refresh_token` auto-sent · **Bearer** = `Authorization: Bearer {{access_token}}` |
| Cookie vs Bearer   | Steps 4–5 need cookie (run before logout clears it). Steps 6, 9–13 need Bearer from step 3                         |
| Password chain     | After step 8 → `new-password`; after step 10 → `changed-password` (step 13 delete uses this)                       |
| No re-login needed | Same `access_token` from step 3 works for all Bearer steps if run within 15 min                                    |
| Rate limits        | register/login/forgot/resend: 429 after too many attempts per IP (disabled in `NODE_ENV=test` only)                |

---

## Security review (current branch)

### Implemented

- bcrypt (cost 12) for passwords
- Separate JWT secrets for access vs refresh/email-change
- Production boot fails on placeholder or identical JWT secrets
- Short access TTL (15 min)
- Refresh tokens hashed at rest; rotation on refresh
- Session revocation on logout, logout-all, password change/reset, email change
- httpOnly + SameSite=lax refresh cookie; `Secure` in production
- Helmet HTTP headers
- CORS restricted to `APP_URL` with credentials
- Rate limiting on register, login, forgot-password, resend-verification
- Forgot-password / resend-verification do not reveal whether email exists
- Previous password-reset tokens invalidated on new forgot-password request
- `POST /auth/resend-verification` for stuck unverified accounts
- 39 automated tests — 37 integration + 2 e2e (health, tokens, middleware, auth flows)

### Remaining gaps

| Item                                   | Risk     | Notes                                                         |
| -------------------------------------- | -------- | ------------------------------------------------------------- |
| **Access JWT not revocable**           | Low      | By design; 15 min window; refresh revocation stops renewal    |
| **Email change without password**      | Low      | Authenticated user can request change with only Bearer token  |
| **`optionalAuth` / `requireVerified`** | —        | Middleware exists but not wired to game routes yet (expected) |
| **Email delivery in dev**              | Dev only | Tokens logged to console — configure Resend in production     |

---

## Postman quick checklist

See [Postman setup guide](#postman-setup-guide) for environment variables, token sources, and scripts.

| #   | Method | Path                        | Auth   |
| --- | ------ | --------------------------- | ------ |
| —   | GET    | `/health`                   | —      |
| 1   | POST   | `/auth/register`            | —      |
| 2   | POST   | `/auth/verify-email`        | —      |
| 3   | POST   | `/auth/login`               | —      |
| 4   | POST   | `/auth/refresh`             | Cookie |
| 5   | POST   | `/auth/logout`              | Cookie |
| 6   | POST   | `/auth/logout-all`          | Bearer |
| 7   | POST   | `/auth/forgot-password`     | —      |
| 8   | POST   | `/auth/reset-password`      | —      |
| 9   | PATCH  | `/auth/change-display-name` | Bearer |
| 10  | PATCH  | `/auth/change-password`     | Bearer |
| 11  | PATCH  | `/auth/change-email`        | Bearer |
| 12  | POST   | `/auth/verify-email`        | —      |
| 13  | DELETE | `/auth/account`             | Bearer |

**Negative cases worth spot-checking:**

| Method | Path                        | Expect                      |
| ------ | --------------------------- | --------------------------- |
| POST   | `/auth/login`               | 403 before verify-email     |
| POST   | `/auth/register`            | 400 missing displayName     |
| POST   | `/auth/register`            | 409 duplicate email         |
| POST   | `/auth/refresh`             | 401 after logout            |
| PATCH  | `/auth/change-display-name` | 400 unchanged or blank name |
| PATCH  | `/auth/change-password`     | 401 wrong current password  |
| DELETE | `/auth/account`             | 401 wrong password          |

---

## Test coverage summary

### Prerequisites

- Postgres running on port **5433** (`docker compose up -d` from repo root)
- Test database `wordlopol_test` on that instance — created and migrated automatically by Vitest global setup (`src/test/global-setup.ts`)
- Resend is **not** called during tests; email helpers are mocked in auth suites

### Suites

| Suite                         | Location         | Tests                                          |
| ----------------------------- | ---------------- | ---------------------------------------------- |
| `health.test.ts`              | `src/__tests__/` | DB connected / empty / degraded                |
| `tokens.test.ts`              | `src/__tests__/` | JWT + refresh create/rotate/revoke             |
| `middleware.test.ts`          | `src/__tests__/` | authenticate, optionalAuth, requireVerified    |
| `email.test.ts`               | `src/__tests__/` | URL builders + send behavior                   |
| `auth-register.test.ts`       | `src/__tests__/` | register → verify → login, resend-verification |
| `auth-session.test.ts`        | `src/__tests__/` | refresh, logout, logout-all                    |
| `auth-account.test.ts`        | `src/__tests__/` | reset, change-password, change-email, delete   |
| `tokens-email-change.test.ts` | `src/__tests__/` | email-change JWT                               |
| `health.e2e.ts`               | `src/__e2e__/`   | health over real HTTP                          |
| `auth.e2e.ts`                 | `src/__e2e__/`   | register → verify → login → refresh over HTTP  |

**Integration** — Supertest against an in-process Express app (`vitest.config.ts`).

```bash
pnpm test                    # from repo root (turbo)
pnpm --filter @wordlopol/api test
```

**Coverage** — v8 provider; text summary in terminal, HTML + lcov in `apps/api/coverage/` (gitignored). Current baseline ~87% statements on `src/` (excludes tests, e2e helpers, generated code).

```bash
pnpm test:coverage
pnpm --filter @wordlopol/api test:coverage
```

**E2E** — real HTTP server on `127.0.0.1:<random port>` (`vitest.e2e.config.ts`). The app is loaded via dynamic import so Vitest email mocks apply before routes bind.

```bash
pnpm test:e2e
pnpm --filter @wordlopol/api test:e2e
```

**All tests** — integration then e2e; this is what CI runs after `prisma migrate deploy` against the test DB.

```bash
pnpm test:all
```
