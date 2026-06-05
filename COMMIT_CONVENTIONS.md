# Commit & PR Conventions

Conventions for commits and pull requests in the Wordlopol monorepo. Designed so each app/package can evolve independently with a clear history.

## Commit message format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | When to use                          |
| ---------- | ------------------------------------ |
| `feat`     | New feature or user-facing behaviour |
| `fix`      | Bug fix                              |
| `docs`     | Documentation only                   |
| `style`    | Formatting, no logic change          |
| `refactor` | Code change without feature/fix      |
| `test`     | Tests added or updated               |
| `chore`    | Tooling, deps, config                |
| `ci`       | GitHub Actions, Husky hooks          |
| `build`    | Build system, bundler, turbo         |
| `perf`     | Performance improvement              |
| `revert`   | Revert a previous commit             |

### Scopes

Use **one primary scope** per commit. Match the area you changed:

| Scope     | Paths                                                                   | Package                      |
| --------- | ----------------------------------------------------------------------- | ---------------------------- |
| `api`     | `apps/api/**`                                                           | `@wordlopol/api`             |
| `web`     | `apps/web/**`                                                           | `@wordlopol/web`             |
| `mobile`  | `apps/mobile/**`                                                        | `@wordlopol/mobile` (future) |
| `shared`  | `packages/shared/**`                                                    | `@wordlopol/shared`          |
| `tooling` | `packages/eslint-config/**`, `packages/tsconfig/**`                     | shared configs               |
| `data`    | `data/**`                                                               | word lists                   |
| `repo`    | root files: `turbo.json`, `docker-compose.yml`, `README.md`, `plans/**` | workspace                    |

**Multi-scope changes**: pick the scope that owns the main intent. If you truly touch two apps equally, use the most important one and mention the other in the body.

```
feat(api): add daily challenge endpoint

Also updates shared DTOs for daily response shape.
```

### Subject rules

- Imperative mood: "add", "fix", "update" (not "added", "fixes")
- Lowercase, no trailing period
- Max ~72 characters
- No ticket IDs required (add in footer if you use Linear/Jira later)

### Examples

```
feat(api): add JWT refresh rotation
fix(web): correct Polish ł key mapping
feat(shared): implement evaluateGuess duplicate-letter logic
chore(repo): bootstrap pnpm workspace and turbo
ci(repo): add GitHub Actions lint and build workflow
docs(repo): document token security and logout flows
chore(api): upgrade Prisma to v7 with pg adapter
feat(web): add daily game board component
test(api): cover auth logout-all endpoint
```

### Breaking changes

Add `!` after scope or `BREAKING CHANGE:` in footer:

```
feat(api)!: rename /daily/guess response fields

BREAKING CHANGE: `letterResults` renamed to `results`. Update web client.
```

## Branch naming

```
<type>/<scope>-<short-description>
```

Examples:

```
feat/api-auth
fix/web-keyboard
chore/repo-husky-commitlint
docs/repo-commit-conventions
```

## Pull request guidelines

### One scope per PR (preferred)

Keep PRs focused so review and CI stay fast:

| Good PR                                     | Avoid                                            |
| ------------------------------------------- | ------------------------------------------------ |
| `feat(api): auth register and login`        | API auth + web login UI + shared types in one PR |
| `feat(web): login and register pages`       | Mixed with unrelated API daily endpoint          |
| `chore(tooling): shared eslint react rules` | Tooling + feature work together                  |

Exception: tightly coupled changes (e.g. API endpoint + web consumer) can ship together if they are useless alone — still use one scope (the driving one) in the title.

### PR title

Use the **same format as commit messages**. Squash-merge PRs use the title as the final commit.

```
feat(api): add password reset flow
```

### PR description template

```markdown
## Summary

- Bullet points of what changed

## Scope

api | web | shared | tooling | data | repo

## Test plan

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] Manual steps (if any)
```

## Initial commit

For the first commit on the repo:

```
chore(repo): initial monorepo scaffold

pnpm + Turborepo workspace with api, web, shared packages,
Prisma 7, Husky, CI, and implementation plans.
```

## Husky hooks (local)

| Hook         | Runs                                                      | Purpose                                                    |
| ------------ | --------------------------------------------------------- | ---------------------------------------------------------- |
| `pre-commit` | `lint-staged`                                             | Auto-fix Prettier + ESLint on **staged files only**        |
| `commit-msg` | `commitlint`                                              | Enforce `type(scope): subject` format                      |
| `pre-push`   | `validate:branch` → `format:check` → `lint` → `typecheck` | Block push if branch name, formatting, lint, or types fail |

Run all checks manually: `pnpm validate`

Config: `commitlint.config.cjs`

### lint-staged

On commit, staged files are processed per package:

- All matching files → Prettier `--write`
- `apps/api/**` → ESLint with `apps/api/eslint.config.js`
- `apps/web/**` → ESLint with `apps/web/eslint.config.js`
- `packages/shared/**` → ESLint with `packages/shared/eslint.config.js`

## GitHub Actions (PR checks)

On every pull request to `main`:

| Job           | Check                                                |
| ------------- | ---------------------------------------------------- |
| `branch-name` | Head branch matches `type/scope-description`         |
| `pr-title`    | PR title matches commit format (semantic PR)         |
| `ci`          | `pnpm format:check` → `lint` → `typecheck` → `build` |

PR title must match commit rules, e.g. `feat(api): add jwt refresh rotation`

## Changelog automation

Per-app changelogs in `apps/api/CHANGELOG.md` and `apps/web/CHANGELOG.md` are updated by [release-please](https://github.com/googleapis/release-please).

| Workflow            | Triggers on              | Release PR / tag |
| ------------------- | ------------------------ | ---------------- |
| `changelog-api.yml` | `apps/api/**`, `data/**` | `api-v0.x.x`     |
| `changelog-web.yml` | `apps/web/**`            | `web-v0.x.x`     |

Changelog workflows run on **`push` to `main`** (includes PR merges, not feature-branch pushes). After merge, check for an open **Release PR** from release-please. Merge that second PR to write `CHANGELOG.md` and create the git tag. If a run was missed, use **Actions → Run workflow** (bootstrap). See [docs/CHANGELOG_AUTOMATION.md](./docs/CHANGELOG_AUTOMATION.md).

Full details: [docs/CHANGELOG_AUTOMATION.md](./docs/CHANGELOG_AUTOMATION.md).

### Allowed branches without naming rule

- `main`
- `release/x.y.z` (e.g. `release/1.0.0`)
- `release-please--*` (changelog bot, e.g. `release-please--branches--main--components--api`)

Release-please PR titles use scope `main` (e.g. `chore(main): release api 0.2.0`). Allowed in CI for bot PRs only — not for human commits.

## Quick reference

```
feat(api): ...
fix(web): ...
chore(shared): ...
docs(repo): ...
ci(repo): ...
```
