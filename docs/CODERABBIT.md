# CodeRabbit setup

AI code review on pull requests. Config: [`.coderabbit.yaml`](../.coderabbit.yaml).

## 1. Install GitHub App (one-time, in browser)

1. Go to [https://github.com/apps/coderabbitai](https://github.com/apps/coderabbitai)
2. Click **Install** / **Configure**
3. Select account: **habbababbai**
4. Repository access: **Only select repositories** → `wordlopol`
5. Click **Install & Authorize**

Or via [coderabbit.ai](https://coderabbit.ai) → Sign in with GitHub → Add repository.

## 2. Verify on a PR

1. Open any PR to `main`
2. CodeRabbit should comment within a few minutes
3. Optional: comment `@coderabbitai review` to trigger manually

## 3. Repo settings (recommended)

**GitHub → wordlopol → Settings → Actions → General**

- Workflow permissions: **Read and write**
- Allow GitHub Actions to **create and approve** pull requests (helps release-please + bots)

## 4. What CodeRabbit reviews

| Path                 | Focus                              |
| -------------------- | ---------------------------------- |
| `apps/api/**`        | Security, Prisma, auth, validation |
| `apps/web/**`        | React, a11y, Polish keyboard       |
| `packages/shared/**` | Pure game logic                    |
| `.github/**`         | CI workflows                       |

## 5. Public repo note

Free tier covers public repositories. Jira/Linear/MCP integrations auto-disable on public repos (expected).

## 6. Customize config

Edit `.coderabbit.yaml` in a PR. CodeRabbit uses the config from the **PR branch** under review.

Generate a starter config from an existing PR:

```
@coderabbitai configuration
```
