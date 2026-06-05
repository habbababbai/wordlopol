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

### PR description

GitHub pre-fills from [`.github/pull_request_template.md`](./.github/pull_request_template.md). Fill every section — **CodeRabbit does not edit the description**.

Planned: local `pnpm pr:draft` to pre-fill the template — see [docs/PR_DESCRIPTION_AUTOMATION.md](./docs/PR_DESCRIPTION_AUTOMATION.md).

Include:

- **Summary** — what changed and why
- **Version bump** — must match PR title (`fix` = patch, `feat` = minor, `feat!` = major, `chore`/`ci`/`docs` = none)
- **Test plan** — what you ran
- **Changelog** — root [CHANGELOG.md](./CHANGELOG.md) for repo/CI/docs; never edit `apps/*/CHANGELOG.md` in feature PRs

### Version bump quick reference

| PR title type                  | Version bump       | Example                    |
| ------------------------------ | ------------------ | -------------------------- |
| `fix(api):`                    | Patch (3rd number) | `0.2.3` → `0.2.4`          |
| `feat(api):`                   | Minor (2nd number) | `0.2.3` → `0.3.0`          |
| `feat(api)!:`                  | Major (1st number) | `0.2.3` → `1.0.0`          |
| `chore` / `ci` / `docs` (repo) | None               | update root CHANGELOG only |

### Docs-only PRs

- Title: `docs(repo): ...`
- Add label **`skip-review`** (auto-applied for markdown-only) or `[skip review]` in title
- Light CI: Prettier only; no CodeRabbit walkthrough

## Initial commit

For the first commit on the repo:

```
chore(repo): initial monorepo scaffold

pnpm + Turborepo workspace with api, web, shared packages,
Prisma 7, Husky, CI, and implementation plans.
```

## Husky hooks (local)

| Hook         | Runs                               | Purpose                                             |
| ------------ | ---------------------------------- | --------------------------------------------------- |
| `pre-commit` | `lint-staged`                      | Auto-fix Prettier + ESLint on **staged files only** |
| `commit-msg` | `commitlint`                       | Enforce `type(scope): subject` format               |
| `pre-push`   | `validate:branch` → `format:check` | Branch name + formatting before push                |

Run all checks manually: `pnpm validate`

Config: `commitlint.config.cjs`

### lint-staged

On commit, staged files are processed per package:

- All matching files → Prettier `--write`
- `apps/api/**` → ESLint with `apps/api/eslint.config.js`
- `apps/web/**` → ESLint with `apps/web/eslint.config.js`
- `packages/shared/**` → ESLint with `packages/shared/eslint.config.js`

## GitHub Actions (PR checks)

| PR type                   | Jobs                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Feature / fix (code)      | `branch-name`, `pr-title`, full `ci` (format, lint, typecheck, build)                         |
| Docs-only (markdown)      | `branch-name`, `pr-title`, `ci-docs` (format only)                                            |
| release-please Release PR | `ci-release-pr` (format only, app changelogs excluded) — no branch-name, pr-title, CodeRabbit |
| Renovate dependency PR    | `branch-name`, `pr-title`, `validate-release-files` skipped — full `ci` still runs            |

Also: `validate-release-files` blocks manual edits to app changelogs and release manifests.

PR title must match commit rules, e.g. `feat(api): add jwt refresh rotation`

## Changelog automation

- **Root** [CHANGELOG.md](./CHANGELOG.md) — repo CI, tooling, docs (you edit manually)
- **Apps** [apps/api/CHANGELOG.md](./apps/api/CHANGELOG.md), [apps/web/CHANGELOG.md](./apps/web/CHANGELOG.md) — release-please only

| Workflow            | Triggers on              | Release PR / tag |
| ------------------- | ------------------------ | ---------------- |
| `changelog-api.yml` | `apps/api/**`, `data/**` | `api-v0.x.x`     |
| `changelog-web.yml` | **Manual** (Actions)     | `web-v0.x.x`     |

After merging a releasable api PR, merge the **Release PR** from release-please. See [docs/CHANGELOG_AUTOMATION.md](./docs/CHANGELOG_AUTOMATION.md).

### Allowed branches without naming rule

- `main`
- `release/x.y.z` (e.g. `release/1.0.0`)
- `release-please--*` (changelog bot, e.g. `release-please--branches--main--components--api`)
- `renovate/*` (dependency bot, e.g. `renovate/pnpm-11.x`)

Release-please PR titles use scope `main` (e.g. `chore(main): release api 0.2.0`). Allowed in CI for bot PRs only — not for human commits.

## Quick reference

```
feat(api): ...
fix(web): ...
chore(shared): ...
docs(repo): ...
ci(repo): ...
```
