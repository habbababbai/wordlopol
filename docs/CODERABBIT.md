# CodeRabbit setup

AI code review on pull requests. Config: [`.coderabbit.yaml`](../.coderabbit.yaml).

## Setup checklist (all required)

### 1. GitHub App

1. [github.com/apps/coderabbitai](https://github.com/apps/coderabbitai) → **Install** / **Configure**
2. Account: **habbababbai**
3. **Only select repositories** → **`wordlopol`**
4. Permissions must include **Pull requests: Read and write**
5. **Save**

### 2. CodeRabbit dashboard (easy to miss)

1. [coderabbit.ai](https://coderabbit.ai) → Sign in with **GitHub** (same account)
2. **Repositories** → ensure **`wordlopol`** is **enabled / toggled on**
3. Without this, reviews may summarize but fail to post inline comments

### 3. GitHub Code review limits (fixes "Failed to post review comments")

GitHub can block bots from submitting **formal** PR reviews. CodeRabbit then fails with:

```
Failed to post review comments
```

**Fix:**

1. Repo → **Settings** → **Moderation** (under Access) → **Code review limits**
   - Direct: [github.com/habbababbai/wordlopol/settings/moderation](https://github.com/habbababbai/wordlopol/settings/moderation)
2. Find **"Limit to users explicitly granted read or higher access"**
3. **Disable** it (recommended for personal repos)

Or keep it enabled and ensure CodeRabbit app has repository access (re-save app install).

Our `.coderabbit.yaml` sets `request_changes_workflow: false` and `review_status: false` so CodeRabbit posts **regular inline comments** instead of formal approve/request-changes reviews.

**PR description:** `high_level_summary: false` — CodeRabbit never edits your description. You fill the PR template; reviews still run automatically (inline comments + walkthrough comment).

### 4. Verify on a PR

1. Open a PR to `main` (not draft)
2. Wait 2–10 minutes
3. Check **Conversation** (summary) and **Files changed** (inline comments)
4. If nothing: comment `@coderabbitai review`
5. Full review also at [app.coderabbit.ai](https://app.coderabbit.ai) → your repo → PR

## What CodeRabbit reviews

| Path                 | Focus                              |
| -------------------- | ---------------------------------- |
| `apps/api/**`        | Security, Prisma, auth, validation |
| `apps/web/**`        | React, a11y, Polish keyboard       |
| `packages/shared/**` | Pure game logic                    |
| `.github/**`         | CI workflows                       |

## Troubleshooting

| Problem                             | Fix                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Summary posts, inline comments fail | Code review limits (step 3 above) + enable repo on coderabbit.ai                                            |
| No review at all                    | Install app on `wordlopol`; enable repo on coderabbit.ai dashboard                                          |
| Draft PR skipped                    | Mark **Ready for review**, or set `drafts: true` in config                                                  |
| Stale PR                            | Comment `@coderabbitai full review`                                                                         |
| Still broken                        | Reinstall app: [settings/installations](https://github.com/settings/installations) → CodeRabbit → Configure |

## Public repo

Free tier covers public repositories.

## Customize config

Edit `.coderabbit.yaml` in a PR. CodeRabbit uses the config from the **PR branch**.
