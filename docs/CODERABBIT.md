# CodeRabbit setup

AI code review on pull requests. Config: [`.coderabbit.yaml`](../.coderabbit.yaml).

## Setup checklist

### 1. GitHub App

1. [github.com/apps/coderabbitai](https://github.com/apps/coderabbitai) → **Install** / **Configure**
2. **Only select repositories** → **`wordlopol`**
3. Permissions must include **Pull requests: Read and write**

### 2. CodeRabbit dashboard

1. [coderabbit.ai](https://coderabbit.ai) → Sign in with GitHub
2. **Repositories** → ensure **`wordlopol`** is enabled

### 3. GitHub code review limits

Repo → **Settings → Moderation → Code review limits** → disable **"Limit to users explicitly granted read or higher access"** (recommended for personal repos).

Or: [github.com/habbababbai/wordlopol/settings/moderation](https://github.com/habbababbai/wordlopol/settings/moderation)

### 4. Label `skip-review`

Create once under **Issues → Labels** (any color). Used for docs-only PRs and manual opt-out.

---

## What CodeRabbit does (and does not do)

| Behavior                                     | Setting                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Does not edit PR description**             | `high_level_summary: false` — you fill [pull_request_template.md](../.github/pull_request_template.md) |
| **No formal approve/request-changes review** | `review_status: false` — inline comments only                                                          |
| **Skips release-please PRs**                 | `!autorelease: pending` label                                                                          |
| **Skips docs / quiet PRs**                   | `!skip-review` label or `[skip review]` in title                                                       |
| **Ignores markdown in reviews**              | `path_filters` exclude `*.md`, `docs/**`, `plans/**`, changelogs                                       |

Reviews still run on feature PRs with code changes. Comments are on the **Files changed** tab — not buried in Conversation walkthroughs for skipped PRs.

---

## Finding comments

| Location          | What appears there                                              |
| ----------------- | --------------------------------------------------------------- |
| **Files changed** | Actionable inline review comments — check here first            |
| **Conversation**  | CodeRabbit walkthrough (skipped on `skip-review` / release PRs) |

Manual review: comment `@coderabbitai review` or `@coderabbitai full review`.

Dashboard: [app.coderabbit.ai](https://app.coderabbit.ai)

---

## When reviews are skipped

| PR type                   | How                                                            |
| ------------------------- | -------------------------------------------------------------- |
| release-please Release PR | Label `autorelease: pending` (automatic)                       |
| Docs-only markdown        | Label `skip-review` (auto-applied) or `[skip review]` in title |
| Any quiet PR              | Add label `skip-review` manually                               |

Full CI and CodeRabbit still run on normal `feat` / `fix` PRs with code changes.

---

## Troubleshooting

| Problem                         | Fix                                                              |
| ------------------------------- | ---------------------------------------------------------------- |
| Inline comments fail to post    | Code review limits (step 3) + enable repo on coderabbit.ai       |
| CodeRabbit edits PR description | Should not happen — verify `high_level_summary: false` on `main` |
| No review on feature PR         | Install app; enable repo; comment `@coderabbitai review`         |
| Draft PR skipped                | Mark ready for review                                            |

Edit `.coderabbit.yaml` in a PR — CodeRabbit uses config from the **PR branch**.
