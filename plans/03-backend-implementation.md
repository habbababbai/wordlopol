# Phase 2 — Backend Implementation

Implement after Phase 1 checklist passes.

## Order of work

### 1. Database migration

```bash
cd apps/api
pnpm prisma migrate dev --name init
pnpm db:import-words
```

Verify `Word` table has 5-letter Polish words from `data/words.txt`.

### 2. Auth module

Create `apps/api/src/routes/auth.ts` and `apps/api/src/services/auth.ts`.

| Task            | Details                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| Register        | Hash password, create user, issue email verify token                                  |
| Verify email    | Validate token, set `emailVerifiedAt`                                                 |
| Login           | Require verified email; return access JWT + refresh cookie                            |
| Refresh         | Rotate refresh token, issue new access JWT                                            |
| Logout          | `POST /auth/logout` — hash cookie token, delete matching `RefreshToken`, clear cookie |
| Logout all      | `POST /auth/logout-all` — delete all `RefreshToken` for user (requires access JWT)    |
| Refresh         | Rotate refresh token (delete old, create new), issue access JWT                       |
| Forgot password | Create `PasswordResetToken`, email link via Resend                                    |
| Reset password  | Validate token, update hash, **delete all RefreshToken** for user                     |
| Change password | Require current password, **delete all RefreshToken** (force re-login)                |
| Change email    | Create token for new email, verify before swap                                        |
| Delete account  | Require password, cascade delete user data                                            |

Env: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`.

### 3. Resend integration

`apps/api/src/lib/email.ts`:

- `sendVerificationEmail(to, token)`
- `sendPasswordResetEmail(to, token)`
- `sendEmailChangeEmail(to, token)`

Links point to `APP_URL` routes (e.g. `/verify-email?token=...`).

### 4. Daily challenge service

`apps/api/src/services/daily.ts`:

- `getOrCreateDailyChallenge(date)`: pick deterministic word for date (hash date → word index)
- `getTodayChallenge()`: return metadata without answer
- Run daily generation via cron or lazy on first request

### 5. Infinite pool service

`apps/api/src/services/infinite.ts`:

- `getOrCreateDailyPool(date)`: e.g. 50 words for the day
- `getNextWord(userId)`: track user progress in session or DB
- Cycle pool when exhausted

### 6. Guess endpoints

`apps/api/src/routes/daily.ts`, `apps/api/src/routes/infinite.ts`:

- Validate guess is in dictionary (`Word` table)
- Use `evaluateGuess` from `@wordlopol/shared`
- Do not reveal answer until win or 6 guesses
- On completion (registered): write `GameResult`, update `UserStats`

### 7. User profile

`apps/api/src/routes/user.ts`:

- Return display name, email, stats from `UserStats`
- Stats visible only to authenticated user (no public profiles)

### 8. Token helpers

`apps/api/src/lib/tokens.ts`:

- `signAccessToken(userId)` — 15 min JWT
- `createRefreshToken(userId)` — random token, store SHA-256 hash in DB, set httpOnly cookie
- `rotateRefreshToken(oldToken)` — validate, delete old, create new
- `revokeRefreshToken(token)` — single device logout
- `revokeAllRefreshTokens(userId)` — logout all devices

Cookie options (production):

```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/auth/refresh', // narrow scope
  maxAge: 7 * 24 * 60 * 60 * 1000,
}
```

### 9. Middleware

- `authenticate` — verify JWT
- `optionalAuth` — attach user if token present
- `requireVerified` — block unverified users from infinite mode
- Rate limiting on `/auth/*`

### 10. Tests

- supertest for auth flows
- Guess evaluation integration tests
- Test DB via Docker or ephemeral Postgres in CI

## Verification

- [ ] Register → verify → login flow works
- [ ] Logout revokes refresh token (refresh after logout fails)
- [ ] Logout-all invalidates all sessions
- [ ] Password change forces re-login on other devices
- [ ] Password reset email sends (Resend dashboard)
- [ ] Daily challenge returns same word for all users per day
- [ ] Infinite requires auth
- [ ] Stats update after completed game
- [ ] `pnpm test` passes in CI

## Next

[04-frontend-implementation.md](./04-frontend-implementation.md)
