# Wordlopol API — endpoints & testing

## Base URLs (local)

| Client           | Base URL                          | Notes                                       |
| ---------------- | --------------------------------- | ------------------------------------------- |
| Express (direct) | `http://localhost:3001/v1`        | Postman, curl, integration tests            |
| Web (Vite proxy) | `http://localhost:5173/api/v1`    | Browser; proxy strips `/api` → server `/v1` |
| Infra probe      | `http://localhost:3001/health`    | Unversioned; DB connectivity only           |
| App health       | `http://localhost:3001/v1/health` | Full health incl. `wordCount`, `apiVersion` |

All **application** routes live under `/v1` on the server (`/v1/auth`, `/v1/daily`, …). `/api` is only the gateway prefix in front of the web app.

Cookie paths (refresh, CSRF): in **development**, refresh cookies are set on both `/api/v1/auth` and `/v1/auth` so Postman against `:3001/v1` and the browser via `:5173/api/v1` both work without env overrides. In **production** and **test**, a single path applies (`/api/v1/auth` or `/v1/auth` respectively).

All JSON request/response bodies unless noted.

**Errors** use a stable machine-readable `code` plus an English `message` (for logs and dev tools). Clients should map `code` to localized copy; the API does not translate strings.

```json
{
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Email not verified"
  }
}
```

Canonical codes and default messages live in [`packages/shared/src/api-error.ts`](../../../packages/shared/src/api-error.ts).

---

## Auth flow overview

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant Email

    Note over Client,Email: Registration
    Client->>API: POST /v1/auth/register
    API->>DB: create User + verification token hash
    API->>Email: send verification link
    Client->>API: POST /v1/auth/verify-email { token }
    API->>DB: set emailVerifiedAt

    Note over Client,DB: Login & sessions
    Client->>API: POST /v1/auth/login
    API-->>Client: accessToken + user (JSON) + refresh_token (httpOnly cookie)
    Client->>API: Bearer accessToken on protected routes
    Client->>API: POST /v1/auth/refresh (cookie auto-sent)
    API-->>Client: new accessToken + rotated refresh cookie

    Note over Client,DB: Logout
    Client->>API: POST /v1/auth/logout (cookie)
    API->>DB: delete refresh token hash
    Client->>API: POST /v1/auth/logout-all (Bearer token)
    API->>DB: delete all refresh tokens for user
```

### Token model

| Token          | Storage                         | Lifetime | Used for                                   |
| -------------- | ------------------------------- | -------- | ------------------------------------------ |
| Access JWT     | Client memory / Postman env     | 15 min   | `Authorization: Bearer <token>`            |
| Refresh token  | httpOnly cookie `refresh_token` | 7 days   | `POST /v1/auth/refresh`, `/v1/auth/logout` |
| Email verify   | Email link → body token         | 24 h     | `POST /v1/auth/verify-email`               |
| Password reset | Email link → body token         | 1 h      | `POST /v1/auth/reset-password`             |
| Email change   | Email link → body token (JWT)   | 24 h     | `POST /v1/auth/verify-email`               |

Refresh tokens are stored as **SHA-256 hashes** in the database (never plaintext). Each refresh **rotates** the token (old one invalidated).

---

## Endpoints

### Health

| Method | Path         | Auth | Description                           |
| ------ | ------------ | ---- | ------------------------------------- |
| GET    | `/health`    | —    | Infra probe (DB only; no `wordCount`) |
| GET    | `/v1/health` | —    | App health for clients                |

**200** — `GET /health` (infra)

```json
{ "status": "ok", "database": "connected" }
```

**200** — `GET /v1/health` (app)

```json
{ "status": "ok", "database": "connected", "wordCount": 4062, "apiVersion": "v1" }
```

**503** — database unreachable (`GET /health`)

```json
{ "status": "degraded", "database": "disconnected" }
```

**503** — database unreachable (`GET /v1/health`)

```json
{ "status": "degraded", "database": "disconnected", "apiVersion": "v1" }
```

---

### Auth — public

| Method | Path                           | Body                               | Success                                                                    |
| ------ | ------------------------------ | ---------------------------------- | -------------------------------------------------------------------------- |
| POST   | `/v1/auth/register`            | `{ email, password, displayName }` | **201** `{ message }` (+ `devToken`, `devAccessToken` in development only) |
| POST   | `/v1/auth/verify-email`        | `{ token }`                        | **200** `{ message }`                                                      |
| POST   | `/v1/auth/login`               | `{ email, password }`              | **200** `{ accessToken, user }` + `Set-Cookie: refresh_token`              |
| POST   | `/v1/auth/resend-verification` | `{ email }`                        | **200** `{ message }` (+ `devToken` in dev when email sent)                |
| POST   | `/v1/auth/forgot-password`     | `{ email }`                        | **200** `{ message }` (+ `devToken` in dev when email sent)                |
| POST   | `/v1/auth/reset-password`      | `{ token, password }`              | **200** `{ message }`                                                      |

Rate-limited (15 min window): `register` (5), `login` (10), `resend-verification` (5), `forgot-password` (5) per IP. **Disabled in `development` and `test`.**

**Validation**

- `password` min 8 chars on register / reset
- `email` must be valid format
- `displayName` required, 1–50 chars after trim

**Development-only `devToken` and `devAccessToken`**

When `NODE_ENV=development`, token-bearing auth endpoints also return `devToken` in the JSON body so Postman can run the full collection without copying from logs or email. **Never present in production or test.**

`register` also returns `devAccessToken` (a valid access JWT for the new, unverified user) so negative Postman flows can hit protected routes such as `GET /v1/infinite/next` and expect **403 Email not verified**.

```json
{ "message": "Verification email sent", "devToken": "64-char-hex", "devAccessToken": "eyJ..." }
```

Endpoints that may include `devToken`: `register`, `resend-verification`, `forgot-password`, `change-email` (only when an email would actually be sent). Only `register` includes `devAccessToken`.

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

These endpoints read the `refresh_token` cookie (path `/api/v1/auth` in dev/prod; `/v1/auth` in test). No Bearer token required.

| Method | Path               | Success                                              |
| ------ | ------------------ | ---------------------------------------------------- |
| POST   | `/v1/auth/refresh` | **200** `{ accessToken }` + new cookie               |
| POST   | `/v1/auth/logout`  | **200** `{ message: "Logged out" }` + cookie cleared |

---

### Auth — Bearer token required

Send header: `Authorization: Bearer <accessToken>`

| Method | Path                           | Body                               | Success                                                  |
| ------ | ------------------------------ | ---------------------------------- | -------------------------------------------------------- |
| POST   | `/v1/auth/logout-all`          | —                                  | **200** `{ message }` + cookie cleared                   |
| PATCH  | `/v1/auth/change-display-name` | `{ displayName }`                  | **200** `{ user }`                                       |
| PATCH  | `/v1/auth/change-password`     | `{ currentPassword, newPassword }` | **200** `{ message }`                                    |
| PATCH  | `/v1/auth/change-email`        | `{ newEmail }`                     | **200** `{ message }` (+ `devToken` in development only) |
| DELETE | `/v1/auth/account`             | `{ password }`                     | **200** `{ message }`                                    |

`change-password`, `logout-all`, and `account` delete also revoke refresh sessions server-side.

---

### User profile

| Method | Path               | Auth   | Description                        |
| ------ | ------------------ | ------ | ---------------------------------- |
| GET    | `/v1/user/profile` | Bearer | Profile + stats for signed-in user |

Only the authenticated user can read their own profile. No public profiles.

**200**

```json
{
  "id": "uuid",
  "email": "player@example.com",
  "displayName": "Player",
  "emailVerified": true,
  "stats": {
    "dailyPlayed": 3,
    "dailyWon": 2,
    "infinitePlayed": 10,
    "infiniteWon": 7,
    "bestTimedWords": null,
    "bestTimedMs": null,
    "bestTimedWord": null
  }
}
```

If the user has never played, numeric stats are `0` and timed fields are `null`.

**401** — missing or invalid Bearer token

**404** — user deleted but token still valid (rare)

---

### Daily challenge

| Method | Path              | Auth     | Description                                        |
| ------ | ----------------- | -------- | -------------------------------------------------- |
| GET    | `/v1/daily/today` | —        | Today's challenge metadata (no answer)             |
| POST   | `/v1/daily/guess` | optional | Validate a guess; persist stats when authenticated |

Calendar day uses `Europe/Warsaw` (`TZ` env). The word is chosen deterministically from the dictionary and persisted lazily on first request for that date.

**GET `/v1/daily/today` — 200**

Sets `daily_guest_session` cookie for unauthenticated clients (httpOnly, path `/api/v1/daily` in dev). Call this before guest guesses.

```json
{
  "date": "2026-06-06",
  "maxGuesses": 6,
  "wordLength": 5
}
```

**POST `/v1/daily/guess` — body**

```json
{ "guess": "mleko" }
```

Guests require the `daily_guest_session` cookie from `GET /v1/daily/today`; the server tracks guess count. Authenticated users send only `{ guess }` as well.

**CSRF:** `POST /v1/daily/guess` requires the `x-csrf-token` header (double-submit cookie). Fetch a token via `GET /v1/auth/csrf` before the first guest guess, or use the token returned on login/refresh for authenticated play.

**POST `/v1/daily/guess` — 200**

```json
{
  "results": ["absent", "present", "absent", "correct", "absent"],
  "won": false,
  "finished": false,
  "guessNumber": 1
}
```

When `finished` is true (win or sixth guess), `answer` is included:

```json
{
  "results": ["correct", "correct", "correct", "correct", "correct"],
  "won": true,
  "finished": true,
  "guessNumber": 2,
  "answer": "wążka"
}
```

On completion, authenticated users get a `GameResult` row and `UserStats` update. Guests are evaluated only (no persistence).

**400** — invalid guess length, not in dictionary, or game already finished

**401** — guest missing or invalid `daily_guest_session` cookie

**409** — authenticated user already completed today's daily

**503** — dictionary empty (no words imported)

```json
{
  "error": {
    "code": "DICTIONARY_NOT_LOADED",
    "message": "Dictionary not loaded"
  }
}
```

---

### Infinite mode

| Method | Path                 | Auth                    | Description                               |
| ------ | -------------------- | ----------------------- | ----------------------------------------- |
| GET    | `/v1/infinite/next`  | Bearer + verified email | Next word metadata from today's pool      |
| POST   | `/v1/infinite/guess` | Bearer + verified email | Validate a guess for the in-progress word |

Requires `authenticate` and `requireVerified`. Guests and unverified users cannot access infinite mode.

Each Warsaw calendar day has one **shared pool** of up to 300 five-letter words (`INFINITE_POOL_SIZE`), lazy-created in `DailyWordPool`. Per player, words are drawn randomly without duplicates within a cycle; when the pool is exhausted the player starts a new cycle over the same word set in a different order.

Call `GET /v1/infinite/next` before guessing. Repeated `GET /v1/infinite/next` calls while a word is in progress return the same `wordNumber` (refresh-safe). The answer is never included until the game is finished.

**GET `/v1/infinite/next` — 200**

```json
{
  "date": "2026-06-06",
  "wordNumber": 1,
  "poolSize": 300,
  "maxGuesses": 6,
  "wordLength": 5
}
```

**POST `/v1/infinite/guess` — body**

```json
{ "guess": "mleko" }
```

**POST `/v1/infinite/guess` — 200**

Same shape as daily guess (`results`, `won`, `finished`, `guessNumber`, optional `answer` when finished). On completion, writes `GameResult` and updates `UserStats`, then clears the in-progress word so the next `GET /v1/infinite/next` serves the following pool word.

**400** — invalid guess, not in dictionary, no word in progress (call `/v1/infinite/next` first), or game already finished

**401** — missing or invalid Bearer token

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

**403** — email not verified

```json
{
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Email not verified"
  }
}
```

**503** — dictionary empty (no words imported)

```json
{
  "error": {
    "code": "DICTIONARY_NOT_LOADED",
    "message": "Dictionary not loaded"
  }
}
```

---

## Error codes

All error responses use `{ "error": { "code", "message" } }`. Use `code` for client-side i18n; treat `message` as an English fallback.

| Code                         | Typical status | Default message                       | When                                        |
| ---------------------------- | -------------- | ------------------------------------- | ------------------------------------------- |
| `VALIDATION_ERROR`           | 400            | Invalid request                       | Request body failed Zod validation          |
| `GUESS_WRONG_LENGTH`         | 400            | Guess must be 5 letters               | Guess length ≠ word length                  |
| `NOT_IN_DICTIONARY`          | 400            | Not in dictionary                     | Guess not in dictionary                     |
| `GAME_ALREADY_FINISHED`      | 400            | Game already finished                 | Guess after max attempts or completion      |
| `NO_WORD_IN_PROGRESS`        | 400            | No word in progress                   | Infinite guess before `GET /infinite/next`  |
| `INVALID_VERIFICATION_TOKEN` | 400            | Invalid or expired verification token | Email verify token invalid/expired          |
| `INVALID_RESET_TOKEN`        | 400            | Invalid or expired reset token        | Password reset token invalid/expired        |
| `EMAIL_UNCHANGED`            | 400            | Email unchanged                       | Change-email with same address              |
| `DISPLAY_NAME_UNCHANGED`     | 400            | Display name unchanged                | Change display name to current value        |
| `UNAUTHORIZED`               | 401            | Unauthorized                          | Missing or invalid Bearer token             |
| `GUEST_SESSION_REQUIRED`     | 401            | Guest session required                | Guest daily guess without session cookie    |
| `INVALID_EMAIL_OR_PASSWORD`  | 401            | Invalid email or password             | Login credentials wrong                     |
| `INVALID_PASSWORD`           | 401            | Invalid password                      | Password confirmation wrong (change/delete) |
| `INVALID_REFRESH_TOKEN`      | 401            | Invalid or expired refresh token      | Refresh cookie invalid/expired              |
| `MISSING_REFRESH_TOKEN`      | 401            | Missing refresh token                 | Refresh without cookie                      |
| `INVALID_ACCESS_TOKEN`       | 401            | Invalid access token                  | Malformed access JWT                        |
| `INVALID_EMAIL_CHANGE_TOKEN` | 401            | Invalid email change token            | Email-change verify token invalid           |
| `EMAIL_NOT_VERIFIED`         | 403            | Email not verified                    | Login or infinite routes before verify      |
| `INVALID_CSRF_TOKEN`         | 403            | Invalid CSRF token                    | CSRF header/cookie mismatch                 |
| `NOT_FOUND`                  | 404            | Not found                             | Unknown route                               |
| `USER_NOT_FOUND`             | 404            | User not found                        | Profile/account target missing              |
| `ALREADY_PLAYED_TODAY`       | 409            | Already played today                  | Second daily attempt (authenticated)        |
| `EMAIL_ALREADY_REGISTERED`   | 409            | Email already registered              | Register/verify with taken email            |
| `CONCURRENT_GUESS_CONFLICT`  | 409            | Concurrent guess conflict             | Parallel guess race                         |
| `WORD_ALREADY_COMPLETED`     | 409            | Word already completed                | Infinite guess on completed word            |
| `TOO_MANY_REQUESTS`          | 429            | Too many requests                     | Rate limit exceeded                         |
| `INTERNAL_ERROR`             | 500            | Internal server error                 | Unhandled server error                      |
| `DICTIONARY_NOT_LOADED`      | 503            | Dictionary not loaded                 | No words in database                        |
| `EMAIL_DELIVERY_FAILED`      | 503            | Email delivery failed                 | Outbound email send failed                  |

### Status summary

| Status | When                                                           |
| ------ | -------------------------------------------------------------- |
| 400    | Invalid body, guess validation, expired token, unchanged field |
| 401    | Missing/invalid auth, refresh, password, or guest session      |
| 403    | Email not verified, invalid CSRF                               |
| 404    | Unknown route or user not found                                |
| 409    | Conflict (email taken, already played, concurrent guess)       |
| 429    | Rate limit exceeded                                            |
| 500    | Unhandled error                                                |
| 503    | Dictionary empty or email delivery failed                      |

---

## Postman setup guide

### Quick start (import ready-made collection)

Files in `apps/api/postman/`:

| File                                                  | Import as                   |
| ----------------------------------------------------- | --------------------------- |
| `Wordlopol-Local.postman_environment.json`            | Environment                 |
| `Wordlopol-Auth.postman_collection.json`              | Collection (auth)           |
| `Wordlopol-Auth-Negative.postman_collection.json`     | Collection (auth edges)     |
| `Wordlopol-Daily.postman_collection.json`             | Collection (daily)          |
| `Wordlopol-Infinite.postman_collection.json`          | Collection (infinite)       |
| `Wordlopol-Infinite-Negative.postman_collection.json` | Collection (infinite edges) |

1. Postman → **Import** → select the environment and collections you need (all six files for full coverage)
2. Select environment **Wordlopol Local** (top-right dropdown)
3. Ensure API is running: `pnpm --filter @wordlopol/api dev`
4. Open a collection (e.g. **Wordlopol Auth (automated)**) → **Run**
5. Run requests in order — tokens and variables are saved automatically via Tests scripts

See [postman/README.md](../postman/README.md) for per-collection run instructions (auth, daily, infinite).

**What gets saved automatically:**

| After request          | Environment variable | Source                    |
| ---------------------- | -------------------- | ------------------------- |
| 01 Register            | `verify_token`       | `response.devToken`       |
| 03 Login               | `access_token`       | `response.accessToken`    |
| 04 Refresh             | `access_token`       | updated access token      |
| 07 Forgot password     | `reset_token`        | `response.devToken`       |
| 08 Reset password      | `password`           | set to `new-password`     |
| 10 Change password     | `password`           | set to `changed-password` |
| 11 Change email        | `email_change_token` | `response.devToken`       |
| 12 Verify email change | `email`              | updated to `new_email`    |

Collection **Pre-request Script** (first request only) sets fresh `email`, `new_email`, `password`, `display_name` and clears stale tokens.

To verify variables mid-run: **Environments → Wordlopol Local → eye icon**, or open Postman **Console** (View → Show Postman Console).

### Manual setup (alternative)

### 1. Prerequisites

```bash
docker compose up -d
pnpm db:migrate
pnpm db:import-words   # optional for health wordCount
pnpm --filter @wordlopol/api dev
```

API runs at `http://localhost:3001/v1` (direct) or `http://localhost:5173/api/v1` (via Vite when `pnpm dev`). Ensure `NODE_ENV=development` (default) so `devToken` is returned for automated Postman runs.

### 2. Environment variables

Create environment **Wordlopol Local**:

| Variable             | Initial value              | Set by                                                           | Used for                         |
| -------------------- | -------------------------- | ---------------------------------------------------------------- | -------------------------------- |
| `base_url`           | `http://localhost:3001/v1` | you (or `http://localhost:5173/api/v1` for cookie auth via Vite) | all requests                     |
| `display_name`       | `Player`                   | collection Pre-request Script                                    | register                         |
| `email`              | _(auto)_                   | collection Pre-request Script                                    | register, login, forgot-password |
| `new_email`          | _(auto)_                   | collection Pre-request Script                                    | change-email                     |
| `password`           | `secure-password`          | collection script; steps 8 & 10 Tests scripts                    | login, change-password, delete   |
| `access_token`       | _(empty)_                  | login Tests script (step 3)                                      | Bearer on steps 6, 9–13          |
| `verify_token`       | _(empty)_                  | register Tests script (step 1)                                   | verify-email (step 2)            |
| `reset_token`        | _(empty)_                  | forgot-password Tests script (step 7)                            | reset-password (step 8)          |
| `email_change_token` | _(empty)_                  | change-email Tests script (step 11)                              | verify-email (step 12)           |

You only need to set `base_url` manually — the collection scripts populate the rest on each run.

### 3. Collection settings

| Setting       | Value                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Cookie jar    | **Enabled** (default) — login sets `refresh_token` automatically                                                    |
| Cookie path   | `/api/v1/auth` (dev) — use Vite `base_url` for refresh/logout, or `REFRESH_COOKIE_PATH=/v1/auth` for direct `:3001` |
| Bearer routes | Authorization → **Bearer Token** → `{{access_token}}`                                                               |
| Content-Type  | `application/json` on all POST/PATCH/DELETE with body                                                               |

### 4. Collection Pre-request Script

Add at **collection** level (runs once per collection run):

```javascript
if (!pm.collectionVariables.get('run_initialized')) {
  const runId = Date.now();
  pm.environment.set('email', `player-${runId}@example.com`);
  pm.environment.set('new_email', `new-player-${runId}@example.com`);
  pm.environment.set('password', 'secure-password');
  pm.environment.set('display_name', 'Player');
  pm.collectionVariables.set('run_initialized', 'true');
}
```

### 5. Automated collection (14 requests)

Run with **Collection Runner** in order. No manual token copying.

| #   | Name                | Method | Path                           | Auth   | Body                                                                                      |
| --- | ------------------- | ------ | ------------------------------ | ------ | ----------------------------------------------------------------------------------------- |
| —   | Health              | GET    | `/health`                      | —      | _(none)_                                                                                  |
| 1   | Register            | POST   | `/v1/auth/register`            | —      | `{ "email": "{{email}}", "password": "{{password}}", "displayName": "{{display_name}}" }` |
| 2   | Verify email        | POST   | `/v1/auth/verify-email`        | —      | `{ "token": "{{verify_token}}" }`                                                         |
| 3   | Login               | POST   | `/v1/auth/login`               | —      | `{ "email": "{{email}}", "password": "{{password}}" }`                                    |
| 4   | Refresh             | POST   | `/v1/auth/refresh`             | Cookie | _(none)_                                                                                  |
| 5   | Logout              | POST   | `/v1/auth/logout`              | Cookie | _(none)_                                                                                  |
| 6   | Logout all          | POST   | `/v1/auth/logout-all`          | Bearer | _(none)_                                                                                  |
| 7   | Forgot password     | POST   | `/v1/auth/forgot-password`     | —      | `{ "email": "{{email}}" }`                                                                |
| 8   | Reset password      | POST   | `/v1/auth/reset-password`      | —      | `{ "token": "{{reset_token}}", "password": "new-password" }`                              |
| 9   | Change display name | PATCH  | `/v1/auth/change-display-name` | Bearer | `{ "displayName": "Updated Player" }`                                                     |
| 10  | Change password     | PATCH  | `/v1/auth/change-password`     | Bearer | `{ "currentPassword": "{{password}}", "newPassword": "changed-password" }`                |
| 11  | Change email        | PATCH  | `/v1/auth/change-email`        | Bearer | `{ "newEmail": "{{new_email}}" }`                                                         |
| 12  | Verify email change | POST   | `/v1/auth/verify-email`        | —      | `{ "token": "{{email_change_token}}" }`                                                   |
| 13  | Delete account      | DELETE | `/v1/auth/account`             | Bearer | `{ "password": "{{password}}" }`                                                          |

**Password chain:** step 8 → `new-password` · step 10 → `changed-password` · step 13 uses `{{password}}` (= `changed-password` after step 10 script).

### 6. Tests scripts

Shared helper — paste at the top of each script that captures a token, or duplicate the two lines inline:

```javascript
function saveDevToken(envVar) {
  const { devToken } = pm.response.json();
  pm.test(`${envVar} set from devToken`, () => pm.expect(devToken).to.be.a('string').and.not.empty);
  pm.environment.set(envVar, devToken);
}
```

**Register (step 1):**

```javascript
pm.test('201', () => pm.response.to.have.status(201));
saveDevToken('verify_token');
```

**Verify email (step 2):**

```javascript
pm.test('200', () => pm.response.to.have.status(200));
pm.test('Email verified', () => pm.expect(pm.response.json().message).to.eql('Email verified'));
```

**Login (step 3):**

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

**Forgot password (step 7):**

```javascript
pm.test('200', () => pm.response.to.have.status(200));
saveDevToken('reset_token');
```

**Reset password (step 8):**

```javascript
pm.test('200', () => pm.response.to.have.status(200));
pm.test('Password reset', () => {
  pm.expect(pm.response.json().message).to.eql('Password reset');
});
pm.environment.set('password', 'new-password');
```

**Change password (step 10):**

```javascript
pm.test('200', () => pm.response.to.have.status(200));
pm.environment.set('password', 'changed-password');
```

**Change email (step 11):**

```javascript
pm.test('200', () => pm.response.to.have.status(200));
saveDevToken('email_change_token');
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
| Rate limits        | Disabled in `development` and `test`; active in production                                                         |

---

## Daily challenge flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: GET /v1/daily/today
    API->>DB: find or create DailyChallenge for Warsaw calendar date
    DB-->>API: challenge metadata
    API-->>Client: date, maxGuesses, wordLength (no answer); Set-Cookie daily_guest_session (guests)
    Client->>API: POST /v1/daily/guess { guess }
    API->>DB: validate word, evaluate guess
    API-->>Client: letter results (answer when finished)
```

### Postman collection

Import `Wordlopol-Daily.postman_collection.json` with the same **Wordlopol Local** environment as auth.

| #   | Request                | Expect                                     |
| --- | ---------------------- | ------------------------------------------ |
| 00  | GET `/health`          | 200, `wordCount > 0`                       |
| 01  | GET `/v1/daily/today`  | 200, saves `daily_date`, sets guest cookie |
| 02  | GET `/v1/daily/today`  | 200, same `date` as step 01                |
| 03  | POST `/v1/daily/guess` | 200, guest wrong guess, no answer          |
| 04  | POST `/v1/daily/guess` | 400, not in dictionary                     |
| 05  | POST `/v1/daily/guess` | 401, guest without session cookie          |

**503 empty dictionary** — only reproducible with an empty `Word` table (covered by Vitest, not the Postman happy path).

---

## Infinite mode flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: GET /v1/infinite/next (Bearer, verified)
    API->>DB: find or create shared DailyWordPool for Warsaw date
    API->>DB: pick random unused word for player cycle
    API-->>Client: date, wordNumber, poolSize, maxGuesses, wordLength (no answer)
    Client->>API: POST /v1/infinite/guess { guess }
    API->>DB: validate word, evaluate guess, record stats on finish
    API-->>Client: letter results (answer when finished)
```

### Postman collection

Import `Wordlopol-Infinite.postman_collection.json` with the same **Wordlopol Local** environment as auth.

| #   | Request                      | Expect                                   |
| --- | ---------------------------- | ---------------------------------------- |
| 00  | GET `/health`                | 200, init user, `wordCount > 0`          |
| 01  | POST `/v1/auth/register`     | 201, saves `verify_token`                |
| 02  | POST `/v1/auth/verify-email` | 200                                      |
| 03  | POST `/v1/auth/login`        | 200, saves `access_token`                |
| 04  | GET `/v1/infinite/next`      | 200, saves `infinite_date`, `wordNumber` |
| 05  | GET `/v1/infinite/next`      | 200, same date and `wordNumber` as 04    |
| 06  | POST `/v1/infinite/guess`    | 200, wrong guess, no answer              |
| 07  | GET `/v1/infinite/next`      | 200, same in-progress `wordNumber`       |

Edge cases: `Wordlopol-Infinite-Negative.postman_collection.json` — 401/403 on `/next` and `/guess`, 400 without word in progress.

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
- `POST /v1/auth/resend-verification` for stuck unverified accounts
- 97 automated integration tests + 7 e2e (health, auth, daily, infinite, guess, profile, tokens, middleware)
- Daily challenge: deterministic word per Warsaw calendar day; lazy DB persistence on `GET /v1/daily/today`; `POST /v1/daily/guess` with optional auth
- Infinite mode: shared daily word pool; `requireVerified` on infinite routes; `POST /v1/infinite/guess` records stats on completion
- User profile: `GET /v1/user/profile` returns profile + stats for authenticated user only

### Remaining gaps

| Item                              | Risk     | Notes                                                                     |
| --------------------------------- | -------- | ------------------------------------------------------------------------- |
| **Access JWT not revocable**      | Low      | By design; 15 min window; refresh revocation stops renewal                |
| **Email change without password** | Low      | Authenticated user can request change with only Bearer token              |
| **devToken in responses**         | Dev only | Returned only when `NODE_ENV=development`; omitted in production and test |

---

## Postman quick checklist

See [Postman setup guide](#postman-setup-guide) for the automated collection, scripts, and environment setup.

| #   | Method | Path                           | Auth              |
| --- | ------ | ------------------------------ | ----------------- |
| —   | GET    | `/health`                      | —                 |
| —   | GET    | `/v1/daily/today`              | —                 |
| —   | POST   | `/v1/daily/guess`              | optional          |
| —   | GET    | `/v1/infinite/next`            | Bearer + verified |
| —   | POST   | `/v1/infinite/guess`           | Bearer + verified |
| —   | GET    | `/v1/user/profile`             | Bearer            |
| 1   | POST   | `/v1/auth/register`            | —                 |
| 2   | POST   | `/v1/auth/verify-email`        | —                 |
| 3   | POST   | `/v1/auth/login`               | —                 |
| 4   | GET    | `/v1/user/profile`             | Bearer            |
| 5   | POST   | `/v1/auth/refresh`             | Cookie            |
| 6   | POST   | `/v1/auth/logout`              | Cookie            |
| 7   | POST   | `/v1/auth/logout-all`          | Bearer            |
| 8   | POST   | `/v1/auth/forgot-password`     | —                 |
| 9   | POST   | `/v1/auth/reset-password`      | —                 |
| 10  | PATCH  | `/v1/auth/change-display-name` | Bearer            |
| 11  | PATCH  | `/v1/auth/change-password`     | Bearer            |
| 12  | PATCH  | `/v1/auth/change-email`        | Bearer            |
| 13  | POST   | `/v1/auth/verify-email`        | —                 |
| 14  | DELETE | `/v1/auth/account`             | Bearer            |

**Negative cases worth spot-checking:**

| Method | Path                           | Expect                           |
| ------ | ------------------------------ | -------------------------------- |
| POST   | `/v1/auth/login`               | 403 before verify-email          |
| POST   | `/v1/auth/register`            | 400 missing displayName          |
| POST   | `/v1/auth/register`            | 409 duplicate email              |
| POST   | `/v1/auth/refresh`             | 401 after logout                 |
| PATCH  | `/v1/auth/change-display-name` | 400 unchanged or blank name      |
| PATCH  | `/v1/auth/change-password`     | 401 wrong current password       |
| DELETE | `/v1/auth/account`             | 401 wrong password               |
| GET    | `/v1/daily/today`              | 503 empty dictionary             |
| POST   | `/v1/daily/guess`              | 400 not in dictionary            |
| POST   | `/v1/daily/guess`              | 401 guest without session cookie |
| GET    | `/v1/infinite/next`            | 401 without Bearer               |
| GET    | `/v1/infinite/next`            | 403 unverified user              |
| GET    | `/v1/user/profile`             | 401 without Bearer               |
| POST   | `/v1/infinite/guess`           | 401 without Bearer               |
| POST   | `/v1/infinite/guess`           | 403 unverified user              |
| POST   | `/v1/infinite/guess`           | 400 no word in progress          |

---

## Test coverage summary

### Prerequisites

- Postgres running on port **5433** (`docker compose up -d` from repo root)
- Test database `wordlopol_test` on that instance — created and migrated automatically by Vitest global setup (`src/test/global-setup.ts`)
- Resend is **not** called during tests; email helpers are mocked in auth suites

### Suites

| Suite                          | Location         | Tests                                             |
| ------------------------------ | ---------------- | ------------------------------------------------- |
| `health.test.ts`               | `src/__tests__/` | DB connected / empty / degraded                   |
| `tokens.test.ts`               | `src/__tests__/` | JWT + refresh create/rotate/revoke                |
| `middleware.test.ts`           | `src/__tests__/` | authenticate, optionalAuth, requireVerified       |
| `email.test.ts`                | `src/__tests__/` | URL builders + send behavior                      |
| `auth-register.test.ts`        | `src/__tests__/` | register → verify → login, resend-verification    |
| `auth-session.test.ts`         | `src/__tests__/` | refresh, logout, logout-all                       |
| `auth-account.test.ts`         | `src/__tests__/` | reset, change-password, change-email, delete      |
| `tokens-email-change.test.ts`  | `src/__tests__/` | email-change JWT                                  |
| `daily-word-picker.test.ts`    | `src/__tests__/` | deterministic word index picker                   |
| `daily-today.test.ts`          | `src/__tests__/` | GET /v1/daily/today, idempotency, empty dict 503  |
| `daily-guess.test.ts`          | `src/__tests__/` | POST /v1/daily/guess guest + auth, stats          |
| `infinite-pool-picker.test.ts` | `src/__tests__/` | seeded shuffle and pool index picker              |
| `infinite-pool.test.ts`        | `src/__tests__/` | shared pool creation, idempotency, 503            |
| `infinite-next.test.ts`        | `src/__tests__/` | GET /v1/infinite/next auth, cycles, no answer     |
| `infinite-guess.test.ts`       | `src/__tests__/` | POST /v1/infinite/guess auth, stats, progression  |
| `user-profile.test.ts`         | `src/__tests__/` | GET /v1/user/profile auth, zero + persisted stats |
| `health.e2e.ts`                | `src/__e2e__/`   | health over real HTTP                             |
| `auth.e2e.ts`                  | `src/__e2e__/`   | register → verify → login → refresh over HTTP     |
| `daily.e2e.ts`                 | `src/__e2e__/`   | daily today over real HTTP                        |
| `daily-guess.e2e.ts`           | `src/__e2e__/`   | daily guess over real HTTP                        |
| `infinite.e2e.ts`              | `src/__e2e__/`   | infinite next over real HTTP                      |
| `infinite-guess.e2e.ts`        | `src/__e2e__/`   | infinite guess over real HTTP                     |
| `user-profile.e2e.ts`          | `src/__e2e__/`   | user profile over real HTTP                       |

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
