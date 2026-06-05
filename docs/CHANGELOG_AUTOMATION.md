# Changelog automation

Per-app releases via [release-please](https://github.com/googleapis/release-please). Repo-level changes use the root [CHANGELOG.md](../CHANGELOG.md) (manual, no bot PR).

## Changelog files

| File                                              | Contents                  | Updated by                                                 |
| ------------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| [CHANGELOG.md](../CHANGELOG.md)                   | CI, Husky, tooling, docs  | **You** in the same PR                                     |
| [apps/api/CHANGELOG.md](../apps/api/CHANGELOG.md) | API features, fixes, perf | **release-please** (Release PR)                            |
| [apps/web/CHANGELOG.md](../apps/web/CHANGELOG.md) | Web features, fixes, perf | **release-please** (manual workflow until web work starts) |

**Never edit** `apps/*/CHANGELOG.md` or `.github/release-please/*-manifest.json` in feature PRs — CI blocks this.

## Version bumps (patch / minor / major)

Controlled by **PR title** (squash-merge commit message):

| Bump               | PR title                                       | Example `0.2.3` → |
| ------------------ | ---------------------------------------------- | ----------------- |
| Patch (3rd number) | `fix(api): ...`                                | `0.2.4`           |
| Minor (2nd number) | `feat(api): ...`                               | `0.3.0`           |
| Major (1st number) | `feat(api)!: ...` or `BREAKING CHANGE:` footer | `1.0.0`           |
| No app release     | `chore(repo):`, `ci(repo):`, `docs(repo):`     | —                 |

Override: add `Release-As: x.y.z` in the squash commit body.

Only **feat**, **fix**, and **perf** appear in app changelogs. Other types are hidden and do not bump version on their own.

## Workflows

| Workflow                                                    | Trigger                                            | Tag          |
| ----------------------------------------------------------- | -------------------------------------------------- | ------------ |
| [changelog-api.yml](../.github/workflows/changelog-api.yml) | Push to `main` touching `apps/api/**` or `data/**` | `api-vX.Y.Z` |
| [changelog-web.yml](../.github/workflows/changelog-web.yml) | **Manual only** (Actions → Run workflow)           | `web-vX.Y.Z` |

`packages/shared/**` does not trigger either workflow. Run **Changelog — API** manually if a release only touches shared code.

## Two-step release flow (API)

1. Merge feature PR to `main` (e.g. `feat(api): add auth`).
2. **Changelog — API** runs → release-please opens/updates a **Release PR** (`release-please--branches--main--components--api`).
3. Merge the Release PR → `apps/api/CHANGELOG.md` updated, git tag `api-vX.Y.Z` created.

Release PRs get **light CI** (Prettier only) and **no CodeRabbit** review.

## Required GitHub settings

### Actions permissions

**Settings → Actions → General**

1. **Workflow permissions**: Read and write permissions
2. **Allow GitHub Actions to create and approve pull requests**: enabled

### `RELEASE_PLEASE_TOKEN` secret

Fine-grained PAT with **Contents** and **Pull requests** read/write. Used instead of `GITHUB_TOKEN` so Release PRs trigger CI.

### Label: `skip-review`

Create once: **Issues → Labels → New label** → name `skip-review`, any color.

Used for docs-only PRs (auto-applied when only markdown changes) and optional manual opt-out from CodeRabbit.

## Docs-only PRs

- Title: `docs(repo): ...`
- CI: Prettier check only (no lint/typecheck/build)
- CodeRabbit: skipped via `skip-review` label or `[skip review]` in title

## Troubleshooting

| Problem                     | Fix                                                                        |
| --------------------------- | -------------------------------------------------------------------------- |
| No Release PR after merge   | Check Actions; verify `RELEASE_PLEASE_TOKEN` and Actions permissions       |
| Duplicate changelog entries | Never hand-edit app changelogs; close stale Release PR and re-run workflow |
| CodeRabbit on Release PR    | Should be skipped via `autorelease: pending` label                         |
| Web release too early       | Web workflow is manual-only until you run it from Actions                  |
