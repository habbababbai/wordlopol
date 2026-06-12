# Changelog

## [1.0.0] — 2026-06-12

First production-ready API for Wordlopol.

### Features

- **Auth** — register, verify email, login, refresh, logout, logout-all, password reset/change, email change, account delete (JWT + httpOnly refresh cookies, CSRF)
- **Daily** — `GET /v1/daily/today`, `POST /v1/daily/guess` for guests and registered users; stats for logged-in players
- **Infinite** — `GET /v1/infinite/next`, `POST /v1/infinite/guess` for verified users; shared daily word pool
- **Profile** — `GET /v1/user/profile` with aggregated stats
- **Health** — `/health` and `/v1/health`
- **Contracts** — `/v1` routes, stable error codes (`@wordlopol/shared`), OpenAPI spec and Postman collections

### Security & quality

- Guest daily anti-cheat; rate limits on auth; refresh token rotation
- Zod validation; Prisma 7 + PostgreSQL; Resend for transactional email
- Integration tests (Supertest) and e2e tests over real HTTP

## [0.8.0](https://github.com/habbababbai/wordlopol/compare/api-v0.7.0...api-v0.8.0) (2026-06-07)

### Features

- **api:** add GET /user/profile ([#25](https://github.com/habbababbai/wordlopol/issues/25)) ([fe9d348](https://github.com/habbababbai/wordlopol/commit/fe9d34855c38c0aebe3d41c66a59c109372de866))

## [0.7.0](https://github.com/habbababbai/wordlopol/compare/api-v0.6.0...api-v0.7.0) (2026-06-07)

### Features

- **api:** add daily and infinite guess endpoints ([#23](https://github.com/habbababbai/wordlopol/issues/23)) ([cea6661](https://github.com/habbababbai/wordlopol/commit/cea666133a18d4b2a98a6630c233ac823a30348d))

## [0.6.0](https://github.com/habbababbai/wordlopol/compare/api-v0.5.0...api-v0.6.0) (2026-06-06)

### Features

- **api:** add infinite pool service and GET /infinite/next ([#21](https://github.com/habbababbai/wordlopol/issues/21)) ([130815d](https://github.com/habbababbai/wordlopol/commit/130815d562dccac6e3534154dbac909cbcd4e867))

## [0.5.0](https://github.com/habbababbai/wordlopol/compare/api-v0.4.0...api-v0.5.0) (2026-06-06)

### Features

- **api:** add daily challenge service and GET /daily/today ([#19](https://github.com/habbababbai/wordlopol/issues/19)) ([327e1d5](https://github.com/habbababbai/wordlopol/commit/327e1d5dd031347d79874c84af913d97e39061b8))

## [0.4.0](https://github.com/habbababbai/wordlopol/compare/api-v0.3.0...api-v0.4.0) (2026-06-05)

### Features

- **api:** add auth endpoints, test harness, and Postman collections ([#16](https://github.com/habbababbai/wordlopol/issues/16)) ([b6e8c04](https://github.com/habbababbai/wordlopol/commit/b6e8c04bc6e44797cf3b0ddf20d2db4c0aa0139f))

## [0.3.0](https://github.com/habbababbai/wordlopol/compare/api-v0.2.0...api-v0.3.0) (2026-06-05)

### Features

- **api:** add database migration and word import ([bfe90f9](https://github.com/habbababbai/wordlopol/commit/bfe90f9debf8f4fc30e968cff78df288801b9398))

### Bug Fixes

- **repo:** sync changelogs, path filters, and prettier on release PRs ([#8](https://github.com/habbababbai/wordlopol/issues/8)) ([382999f](https://github.com/habbababbai/wordlopol/commit/382999f61e26efe47a0481af9a84a12cc8ea7ff9))

## [0.2.0](https://github.com/habbababbai/wordlopol/compare/api-v0.1.0...api-v0.2.0) (2026-06-05)

### Features

- **api:** add database migration and word import ([bfe90f9](https://github.com/habbababbai/wordlopol/commit/bfe90f9debf8f4fc30e968cff78df288801b9398))
