# Changelog

Repo-level changes: CI, Husky, release automation, docs, and monorepo tooling.

App releases are tracked separately:

- [apps/api/CHANGELOG.md](./apps/api/CHANGELOG.md)
- [apps/web/CHANGELOG.md](./apps/web/CHANGELOG.md)

## Unreleased

### CI

- Upgrade to pnpm 11 with supply-chain hardening (`minimumReleaseAge`, `trustPolicy`, `allowBuilds`); document in [docs/SUPPLY_CHAIN.md](./docs/SUPPLY_CHAIN.md)
- Add `pnpm audit` and GitHub Dependency Review gates in CI
- Pin GitHub Actions to commit SHAs; add Renovate for dependency and action updates
- Redesign release-please workflows, CodeRabbit skip rules, and light CI for docs-only PRs
