# Changelog automation

Per-app changelogs are maintained by [release-please](https://github.com/googleapis/release-please) via separate GitHub Actions workflows.

## Changelog files

| App | Changelog                                         | Workflow                                                    |
| --- | ------------------------------------------------- | ----------------------------------------------------------- |
| API | [apps/api/CHANGELOG.md](../apps/api/CHANGELOG.md) | [changelog-api.yml](../.github/workflows/changelog-api.yml) |
| Web | [apps/web/CHANGELOG.md](../apps/web/CHANGELOG.md) | [changelog-web.yml](../.github/workflows/changelog-web.yml) |

## When does it run?

**Only when a PR is merged into `main`** — not on:

- feature branch pushes
- PR open or sync (new commits on PR)
- closed-but-not-merged PRs

Workflow trigger: `pull_request: closed` + `merged == true`.

Direct pushes to `main` (without a PR) do **not** trigger changelog workflows.

## How it works

1. You open a PR → **no changelog update yet**.
2. You **merge** the PR to `main` with conventional commits (`feat(api): ...`, `fix(web): ...`).
3. The matching workflow runs (based on changed paths in that PR).
4. **release-please** opens or updates a **Release PR** for that app, e.g.:
   - `release-please--branches--main--components--api`
   - `release-please--branches--main--components--web`
5. That Release PR contains:
   - Updated `CHANGELOG.md`
   - Version bump in `package.json`
   - Updated `.github/release-please/*-manifest.json`
6. When you **merge the Release PR**, release-please creates a git tag:
   - `api-v0.2.0`
   - `web-v0.2.0`

## Which workflow runs?

| Changed paths        | Workflow                                   |
| -------------------- | ------------------------------------------ |
| `apps/api/**`        | Changelog — API                            |
| `apps/web/**`        | Changelog — Web                            |
| `packages/shared/**` | **Both** (shared code affects api and web) |

Keep commits scoped and files in the right app directory so the correct changelog picks up changes.

## Commit types → changelog sections

| Commit type | Changelog section   |
| ----------- | ------------------- |
| `feat`      | Features            |
| `fix`       | Bug Fixes           |
| `perf`      | Performance         |
| `refactor`  | Refactoring         |
| `docs`      | Documentation       |
| `test`      | Tests               |
| `build`     | Build System        |
| `ci`        | CI                  |
| `chore`     | Hidden (not listed) |

## Versioning

- Starts at **0.1.0** per app (independent versions).
- `feat` → minor bump (pre-1.0: treated as minor)
- `fix` → patch bump
- `feat!` / `BREAKING CHANGE` → major bump

## Adding a new app (e.g. mobile)

1. Copy `.github/release-please/api-config.json` → `mobile-config.json`
2. Copy `api-manifest.json` → `mobile-manifest.json`
3. Add `.github/workflows/changelog-mobile.yml`
4. Add `apps/mobile/CHANGELOG.md`

## Manual release (if needed)

Normally you only merge the Release PR. No manual tagging required.
