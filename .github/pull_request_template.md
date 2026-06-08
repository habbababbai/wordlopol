## Summary

<!-- What changed and why — 1–3 bullets, imperative mood. Delete this comment. -->

-

## Scope

<!-- Primary area: api | web | shared | data | repo -->

repo

## Test plan

- [ ] `pnpm validate` (branch + format + lint + typecheck)
- [ ] `pnpm test:all` (if API/web/shared code changed)
- [ ] Manual checks:

## Changelog

- [ ] **Repo / CI / docs** — edit root [CHANGELOG.md](../CHANGELOG.md) in this PR
- [ ] **App release** — do **not** edit `apps/*/CHANGELOG.md`; merge to `main`, then run **Changelog — API/Web** from Actions and merge the Release PR
- [ ] **Docs only** — no changelog entry required

---

**PR title** (squash merge message): `type(scope): lowercase subject`

Examples: `feat(api): add daily challenge` · `fix(web): keyboard mapping` · `docs(repo): update plans`

**Branch**: `type/scope-description` — e.g. `feat/api-daily-challenge`

Conventions: [docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md)

**Note:** CodeRabbit does not edit this description. Reviews appear as inline comments under **Files changed**.
