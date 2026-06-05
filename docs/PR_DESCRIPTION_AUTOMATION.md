# PR description automation (plan)

Draft plan for reducing manual work when opening human PRs. **Not implemented yet.**

Related: [pull_request_template.md](../.github/pull_request_template.md), [COMMIT_CONVENTIONS.md](../COMMIT_CONVENTIONS.md), [CHANGELOG_AUTOMATION.md](./CHANGELOG_AUTOMATION.md), [CODERABBIT.md](./CODERABBIT.md).

## Problem

GitHub pre-fills the PR template, but authors still manually:

- Write Summary bullets
- Pick scope and tick version-bump / changelog / skip-review checkboxes
- Fill the test plan

This is repetitive and error-prone (wrong checkbox, scope mismatch with branch name, etc.).

## Goals

- Generate a **copy-paste-ready** PR body that matches `.github/pull_request_template.md`
- Infer **scope**, **version bump**, **CI mode**, and **changelog** rules from branch name + diff
- Suggest **PR title** from branch name or top commit
- Keep the author in control of Summary wording (at least in v1)

## Non-goals

- **No AI/LLM in v1** — deterministic rules only
- **Do not edit bot PRs** — skip `renovate/*` and `release-please--*`
- **Do not enable CodeRabbit PR descriptions** — keep `high_level_summary: false` in `.coderabbit.yaml`
- **Do not replace commit discipline** — good commit messages improve draft quality but are not required

## Recommended approach (phased)

### Phase 1 — Local draft script (MVP)

Add `scripts/draft-pr-body.sh` and `pnpm pr:draft` in root `package.json`.

**Inputs**

| Source                             | Used for                                 |
| ---------------------------------- | ---------------------------------------- |
| Current branch name                | `type`, `scope`, suggested title         |
| `git log main..HEAD --oneline`     | Summary bullets (commit subjects)        |
| `git diff main...HEAD --name-only` | Scope override, path-based checkboxes    |
| `git diff main...HEAD --stat`      | Optional “files changed” hint in Summary |

**Outputs**

- Markdown printed to stdout
- Optional: write to `.git/pr-body.md` (gitignored) for `gh pr create --body-file`

**CLI**

```bash
pnpm pr:draft              # print body to stdout
pnpm pr:draft --write      # write .git/pr-body.md
```

**Branch name parsing**

Pattern: `<type>/<scope>-<description>` (see `scripts/validate-branch-name.sh`).

| Branch example                       | Inferred type | Inferred scope |
| ------------------------------------ | ------------- | -------------- |
| `ci/repo-renovate-branch-exemptions` | `ci`          | `repo`         |
| `feat/api-add-auth`                  | `feat`        | `api`          |
| `docs/repo-supply-chain`             | `docs`        | `repo`         |

Fallback if branch is `main` or unparsable: use latest commit `type(scope):` via commitlint-style regex.

**Path-based rules** (when branch scope is ambiguous or multi-area)

| Paths changed                           | Scope                                       | Notes                                      |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| `apps/api/**` only                      | `api`                                       |                                            |
| `apps/web/**` only                      | `web`                                       |                                            |
| `packages/shared/**`                    | `shared`                                    |                                            |
| `data/**`                               | `data`                                      |                                            |
| `.github/**`, `scripts/**`, root config | `repo`                                      |                                            |
| Multiple app paths                      | branch scope, or `repo` + warning in output | prefer branch scope per COMMIT_CONVENTIONS |

**Checkbox rules**

| Condition                                          | Version bump | Skip CodeRabbit         | Changelog                    |
| -------------------------------------------------- | ------------ | ----------------------- | ---------------------------- |
| `type` in `chore`, `ci`, `docs` and scope `repo`   | **none**     | N/A unless docs-only    | root CHANGELOG or docs-only  |
| `type` = `fix` and scope `api`/`web`               | **patch**    | Not applicable          | app release (no manual edit) |
| `type` = `feat` and scope `api`/`web`              | **minor**    | Not applicable          | app release                  |
| title contains `!` or `BREAKING CHANGE`            | **major**    | Not applicable          | app release                  |
| only `*.md`, `docs/**`, `plans/**` (no code paths) | **none**     | docs-only / skip-review | docs only                    |
| `apps/api/**` or `apps/web/**` code touched        | —            | Not applicable          | check `pnpm build`           |

Reuse the same path logic as [ci.yml](../.github/workflows/ci.yml) `changes` job and [auto-label-docs.yml](../.github/workflows/auto-label-docs.yml) for docs-only detection.

**Summary generation (v1)**

- One bullet per commit on the branch (strip `type(scope):` prefix, imperative mood)
- If single commit: one bullet
- If many commits: cap at 3 bullets + “(N commits)” note
- Author edits before opening PR

**Success criteria (Phase 1)**

- [ ] `pnpm pr:draft` on a feature branch prints valid template markdown
- [ ] Scope and version-bump checkboxes match PR title type
- [ ] Docs-only PR auto-checks skip-review path
- [ ] Script exits with clear error off `main` with no commits ahead

### Phase 2 — `gh pr create` wrapper

Add `scripts/create-pr.sh` and `pnpm pr:create`.

```bash
pnpm pr:create
# 1. validate branch name
# 2. pnpm pr:draft --write
# 3. gh pr create --title "<from branch or commit>" --body-file .git/pr-body.md
```

**Flags**

- `--draft` — open as draft PR
- `--title "..."` — override inferred title

**Success criteria (Phase 2)**

- [ ] One command opens a PR with pre-filled body
- [ ] Title passes `action-semantic-pull-request` rules
- [ ] Works when `gh` is authenticated

### Phase 3 — Optional GitHub Action (only if Phase 1–2 feel insufficient)

Workflow: `pull_request: opened` → fill body **only if** description is still the default template (detect placeholder `-` under Summary or unchanged template markers).

**Skip when**

- `renovate/*`, `release-please--*`
- Body already edited by author
- PR opened by bot

**Pros:** Zero local setup for contributors.  
**Cons:** Harder to test; risk of overwriting custom text if detection is wrong.

**Defer until** Phase 1–2 are stable and the team wants server-side automation.

## Files to add (Phase 1–2)

| File                                | Purpose                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| `scripts/draft-pr-body.sh`          | Core logic                                                  |
| `scripts/create-pr.sh`              | Optional `gh` wrapper (Phase 2)                             |
| `scripts/lib/pr-draft-*.sh`         | Only if script grows > ~150 lines; prefer single file first |
| `.gitignore`                        | Add `.git/pr-body.md` if using `--write`                    |
| `package.json`                      | `pr:draft`, `pr:create` scripts                             |
| `docs/PR_DESCRIPTION_AUTOMATION.md` | This plan (update when implemented)                         |

## Files to update (when implemented)

| File                                                            | Change                                       |
| --------------------------------------------------------------- | -------------------------------------------- |
| [COMMIT_CONVENTIONS.md](../COMMIT_CONVENTIONS.md)               | Link to `pnpm pr:draft` under PR description |
| [README.md](../README.md)                                       | One line under PR checks                     |
| [pull_request_template.md](../.github/pull_request_template.md) | Optional hint: “Run `pnpm pr:draft`”         |

## Testing plan (implementation time)

1. **Fixture branches** (local or ephemeral):
   - `ci/repo-*` — repo tooling, version bump none
   - `feat/api-*` with `apps/api/**` changes — patch/minor, build checked
   - `docs/repo-*` with only markdown — docs-only checkboxes
2. **Edge cases**:
   - Branch on `main` (should error)
   - No commits ahead of `main` (should error)
   - Multi-scope diff (warning in output)
3. **Integration**: `gh pr create --body-file` on a test branch (then close PR)

## Open questions

1. **Base branch** — always `main`, or detect `origin/HEAD`?
2. **Summary quality** — is commit-subject bullets enough, or add Phase 4 AI assist behind an opt-in flag?
3. **CHANGELOG.md** — should the script remind to edit root CHANGELOG for `ci`/`chore(repo)` PRs, or leave checkbox only?
4. **PR title** — derive from branch slug (`ci/repo-renovate-branch-exemptions` → `ci(repo): renovate branch exemptions`) or require explicit `--title`?

## Decision log (fill when implementing)

| Date | Decision                 | Rationale                                    |
| ---- | ------------------------ | -------------------------------------------- |
| —    | Start with Phase 1 only  | Lowest risk, no GitHub permissions           |
| —    | No CodeRabbit PR editing | Author owns description; reviews stay inline |

## Out of scope / explicitly rejected

- Enabling CodeRabbit `high_level_summary`
- Auto-filling Renovate or release-please PR bodies
- Mandatory Action that overwrites PR descriptions on every sync
