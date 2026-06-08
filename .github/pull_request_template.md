## Summary

<!-- What changed and why — 1–3 bullets, imperative mood. Delete this comment. -->

-

## Scope

<!-- Primary area: api | web | shared | data | repo -->

repo

## Version bump

<!-- Pick ONE. PR title type must match. See docs/CHANGELOG_AUTOMATION.md -->

- [ ] **none** — `chore` / `ci` / `docs` (repo) — config or docs only; update [CHANGELOG.md](../CHANGELOG.md) if repo-level
- [ ] **patch** — `fix(api|web):` — bug fix (third number, e.g. 0.2.1)
- [ ] **minor** — `feat(api|web):` — new feature (second number, e.g. 0.3.0)
- [ ] **major** — `feat(api|web)!:` or `BREAKING CHANGE:` in body (first number, e.g. 1.0.0)

## Skip CodeRabbit / light CI

<!-- For docs-only or quiet PRs -->

- [ ] Markdown-only PR — label `skip-review` is applied automatically, or add it manually
- [ ] Or put `[skip review]` in the PR title
- [ ] Not applicable — code changed, full review + CI expected

## Test plan

- [ ] `pnpm validate` (branch + format + lint + typecheck)
- [ ] `pnpm build` (if API/web/shared code changed)
- [ ] Manual checks:

## Changelog

<!-- Where to record this change -->

- [ ] **App release** — do **not** edit `apps/*/CHANGELOG.md`; run **Changelog — API/Web** from Actions, then merge the Release PR
- [ ] **Repo / CI / docs** — edit root [CHANGELOG.md](../CHANGELOG.md) in this PR
- [ ] **Docs only** — no changelog entry required

---

**PR title** (squash merge message): `type(scope): lowercase subject`

Examples: `feat(api): add daily challenge` · `fix(api): correct health check` · `docs(repo): update plans` · `ci(repo): skip CI on release PRs`

**Branch**: `type/scope-description` — e.g. `feat/api-daily-challenge`, `docs/repo-auth-plan`

Conventions: [COMMIT_CONVENTIONS.md](../COMMIT_CONVENTIONS.md)

**Note:** CodeRabbit does not edit this description. Reviews appear as inline comments under **Files changed** (not Conversation).
