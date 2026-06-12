# Changelog

Repo-level changes: CI, Husky, release automation, docs, and monorepo tooling.

App releases are tracked separately:

- [apps/api/CHANGELOG.md](./apps/api/CHANGELOG.md)
- [apps/web/CHANGELOG.md](./apps/web/CHANGELOG.md)

## [1.0.0] — 2026-06-12

First playable release of Wordlopol.

### Monorepo

- pnpm 11 workspaces + Turborepo; `@wordlopol/shared` (game logic + API DTOs)
- Husky, commitlint, ESLint, Prettier, GitHub Actions (`validate`, `test:all`)
- Supply-chain hardening — [docs/SUPPLY_CHAIN.md](./docs/SUPPLY_CHAIN.md)
- `pnpm audit` and Dependency Review in CI; Actions pinned to SHAs; Renovate
- Manual-only release-please workflows for API and web
- [docs/V1.md](./docs/V1.md) — 1.0 scope and pre-release QA checklist

### Product

- **API** `@wordlopol/api` 1.0.0 — auth, daily/infinite, profile, `/v1` HTTP API
- **Web** `@wordlopol/web` 1.0.0 — full SPA: home, daily, infinite, auth, profile, settings, game UX
