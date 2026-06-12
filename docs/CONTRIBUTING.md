# Contributing

How to work in the Wordlopol monorepo — commits, branches, pull requests, releases, and local checks.

## Commits

Format: `type(scope): subject`

```
feat(api): add password reset flow
fix(web): correct polish keyboard mapping
docs(repo): update contributing guide
```

### Types

`feat` · `fix` · `docs` · `style` · `refactor` · `test` · `chore` · `ci` · `build` · `perf` · `revert`

### Scopes

| Scope     | Paths                                               |
| --------- | --------------------------------------------------- |
| `api`     | `apps/api/**`                                       |
| `web`     | `apps/web/**`                                       |
| `shared`  | `packages/shared/**`                                |
| `tooling` | `packages/eslint-config/**`, `packages/tsconfig/**` |
| `data`    | `data/**`                                           |
| `repo`    | root config, `docs/**`, CI                          |

Pick the scope that owns the main intent. Mention other areas in the body if needed.

### Subject rules

- Imperative mood, lowercase, no trailing period
- ~72 characters max

### Breaking changes

`feat(api)!: ...` or `BREAKING CHANGE:` in the footer.

## Branches

```
type/scope-short-description
```

Examples: `feat/api-auth` · `fix/web-keyboard` · `docs/repo-contributing`

Allowed without the naming rule: `main`, `release/x.y.z`, `release-please--*`, `renovate/*`.

## Pull requests

A **PR** is a scoped change (e.g. auth pages, docs cleanup). A PR may contain **multiple commits** — squash-merge uses the **PR title** as the final commit on `main`.

### Title

Same format as commits: `feat(web): add login page`

### Description

Use [`.github/pull_request_template.md`](../.github/pull_request_template.md). Fill Summary, Scope, and Test plan. **CodeRabbit does not edit the description** — reviews appear as inline comments under **Files changed**.

### Scope

Prefer one primary area per PR. Exception: tightly coupled API + web changes that are useless alone (title uses the driving scope).

### Docs-only PRs

- Title: `docs(repo): ...`
- CI runs Prettier only (`ci-docs` job)
- Add label `skip-review` or `[skip review]` in the title to skip CodeRabbit

### CodeRabbit

Config: [`.coderabbit.yaml`](../.coderabbit.yaml). Inline review on code PRs; skipped on release-please PRs (`autorelease: pending`) and docs-only (`skip-review`). Re-run manually: `@coderabbitai review`.

## Releases and changelogs

| File                                             | Updated by                       |
| ------------------------------------------------ | -------------------------------- |
| [CHANGELOG.md](../CHANGELOG.md)                  | You — repo CI, tooling, docs PRs |
| `apps/api/CHANGELOG.md`, `apps/web/CHANGELOG.md` | **release-please** only          |

**Never edit** `apps/*/CHANGELOG.md` or `.github/release-please/*-manifest.json` in feature PRs — CI blocks this.

### App release flow

1. Merge feature PR(s) to `main` (`feat(api):` → minor, `fix(web):` → patch, `feat(api)!:` → major).
2. Run **Changelog — API** or **Changelog — Web** from GitHub Actions.
3. Merge the **Release PR** from release-please → tag `api-vX.Y.Z` or `web-vX.Y.Z`.

Release PRs get light CI (Prettier only) and no CodeRabbit review.

`chore(repo):`, `ci(repo):`, `docs(repo):` PRs do not trigger app releases — update root CHANGELOG if repo-level.

## Local checks

| Command         | What it runs                                               |
| --------------- | ---------------------------------------------------------- |
| `pnpm validate` | branch name + format + lint + typecheck                    |
| `pnpm test:all` | API integration + e2e + web tests (needs Postgres on 5433) |

### Husky hooks

| Hook         | Runs                                              |
| ------------ | ------------------------------------------------- |
| `pre-commit` | Prettier + ESLint on staged files (`lint-staged`) |
| `commit-msg` | Commitlint (`commitlint.config.cjs`)              |
| `pre-push`   | branch name + `pnpm format:check`                 |

## CI (pull requests)

| PR type        | Jobs                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| Code changes   | branch name, PR title, full `ci` (format, lint, typecheck, build, tests) |
| Docs only      | branch name, PR title, `ci-docs` (format)                                |
| release-please | `ci-release-pr` (format, app changelogs excluded)                        |

Also: `validate-release-files` blocks manual app changelog edits; `dependency-review` on PRs.

## Project docs

- [V1.md](./V1.md) — 1.0 shipped scope and pre-release QA
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design
- [SUPPLY_CHAIN.md](./SUPPLY_CHAIN.md) — pnpm supply-chain settings
