# Changelog automation

Per-app changelogs via [release-please](https://github.com/googleapis/release-please).

## Changelog files

| App | Changelog                                         | Workflow                                                    |
| --- | ------------------------------------------------- | ----------------------------------------------------------- |
| API | [apps/api/CHANGELOG.md](../apps/api/CHANGELOG.md) | [changelog-api.yml](../.github/workflows/changelog-api.yml) |
| Web | [apps/web/CHANGELOG.md](../apps/web/CHANGELOG.md) | [changelog-web.yml](../.github/workflows/changelog-web.yml) |

## When does it run?

| Trigger                | Runs?                                           |
| ---------------------- | ----------------------------------------------- |
| PR merged to `main`    | **Yes** (merge creates a `push` to `main`)      |
| Push to feature branch | No                                              |
| PR opened / updated    | No                                              |
| Manual                 | **Yes** — Actions → workflow → **Run workflow** |

> **Why not `pull_request: closed`?** Workflows must already exist on `main` before the PR closes. The first PR that added changelog workflows could never trigger itself. `push` to `main` is the official release-please pattern and is more reliable.

## Required GitHub settings

### Actions permissions

**Settings → Actions → General**

1. **Workflow permissions**: Read and write permissions
2. **Allow GitHub Actions to create and approve pull requests**: enabled

Without #2, release-please cannot open Release PRs.

### `RELEASE_PLEASE_TOKEN` secret

**Settings → Secrets and variables → Actions → `RELEASE_PLEASE_TOKEN`**

Fine-grained PAT for repo `wordlopol` with **Contents** and **Pull requests** read/write.

Changelog workflows use this instead of `GITHUB_TOKEN` so Release PRs trigger CI (GitHub blocks workflows triggered by `GITHUB_TOKEN` events).

Without this secret, changelog workflows fail at the release-please step.

## How it works

1. Merge a PR to `main` with conventional commits (`feat(api): ...`).
2. `push` to `main` triggers the matching workflow (by changed paths).
3. release-please opens or updates a **Release PR**, e.g. `release-please--branches--main--components--api`.
4. Release PR contains: `CHANGELOG.md`, version bump, manifest update.
5. Merge the Release PR → git tag created (`api-v0.2.0`).

## Bootstrap (first time / missed run)

If the first merge happened before workflows existed on `main`:

1. GitHub → **Actions** → **Changelog — API** → **Run workflow** → branch `main`
2. Same for **Changelog — Web** if needed
3. Check for new Release PR(s) and merge them

## Which workflow runs?

| Changed paths            | Workflow        |
| ------------------------ | --------------- |
| `apps/api/**`, `data/**` | Changelog — API |
| `apps/web/**`            | Changelog — Web |
| `packages/shared/**`     | **Both**        |

## Commit types → changelog sections

| Type       | Section       |
| ---------- | ------------- |
| `feat`     | Features      |
| `fix`      | Bug Fixes     |
| `perf`     | Performance   |
| `refactor` | Refactoring   |
| `docs`     | Documentation |
| `test`     | Tests         |
| `build`    | Build System  |
| `ci`       | CI            |
| `chore`    | Hidden        |

## Versioning

- Starts at **0.1.0** per app (independent).
- `feat` → minor | `fix` → patch | `feat!` → major

## Troubleshooting

| Problem                                            | Fix                                                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| No Release PR after merge                          | Check Actions tab; verify Actions permissions + `RELEASE_PLEASE_TOKEN` secret                |
| `not permitted to create or approve pull requests` | Settings → Actions → allow Actions to create PRs                                             |
| Release PR: checks stuck "Waiting"                 | Old PR used `GITHUB_TOKEN` — close it, merge PAT fix, re-run changelog workflow              |
| Release PR: `branch-name` / `pr-title` fail        | Bot branch/title — ensure `release-please--*` exemption and `main` scope in CI are on `main` |
| Workflow skipped                                   | Paths filter — ensure changes touch `apps/api/**`, `data/**`, or `apps/web/**`               |
| First merge missed                                 | Actions → **Run workflow** on Changelog — API / Web                                          |
| Stale `release-please--*` PR                       | Close it before re-running changelog workflow                                                |
