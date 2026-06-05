# Supply chain & dependency security

pnpm 11 supply-chain policies, CI security gates, Renovate, and GitHub Actions pinning. Config: [`pnpm-workspace.yaml`](../pnpm-workspace.yaml), [`renovate.json`](../renovate.json), [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Prerequisites

- **Node.js 22+** (pnpm 11 requirement)
- **pnpm 11+** via Corepack:

```bash
corepack enable
corepack prepare pnpm@11.5.2 --activate
```

Root [`package.json`](../package.json) pins `packageManager: "pnpm@11.5.2"` and `engines.node: ">=22"`.

---

## pnpm supply-chain config

Settings live in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) (pnpm 11 reads non-auth config here, not `.npmrc`).

| Setting                   | Value                      | Purpose                                                             |
| ------------------------- | -------------------------- | ------------------------------------------------------------------- |
| `minimumReleaseAge`       | `1440` (24h)               | Block installing package versions published within the last day     |
| `minimumReleaseAgeStrict` | `true`                     | Fail resolution instead of silently picking a too-new version       |
| `trustPolicy`             | `no-downgrade`             | Reject versions with weaker npm publish trust than earlier releases |
| `allowBuilds`             | see yaml                   | Only listed packages may run install/postinstall scripts            |
| `overrides`               | `tar`, `@hono/node-server` | Force patched transitive versions (audit debt)                      |

### `allowBuilds`

Dependency lifecycle scripts are **blocked by default**. Currently allowed:

- `bcrypt`, `prisma`, `@prisma/client`, `@prisma/engines`, `esbuild`

If `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS`, add the package to `allowBuilds` (or run `pnpm approve-builds` interactively). Workspace scripts (`prepare`, `postinstall` in app `package.json`) are not affected.

### `trustPolicyExclude`

Some packages fail trust checks despite being legitimate (missing provenance on newer releases). Excluded today:

- `undici-types@6.21.0`
- `semver@6.3.1`, `semver@7.8.2`

Add entries sparingly and document why in the PR.

### Overrides

Used when audit finds vulnerable **transitive** deps you cannot bump directly:

```yaml
overrides:
  tar: '>=7.5.8'
  '@hono/node-server': '>=1.19.13'
```

After changing overrides, refresh the lockfile: `pnpm install`.

---

## CI security gates

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

### Which job runs?

| PR type                                   | Job                 | Checks                                             |
| ----------------------------------------- | ------------------- | -------------------------------------------------- |
| Code or mixed docs+code                   | `ci`                | install, **audit**, format, lint, typecheck, build |
| Docs only (`*.md`, `docs/**`, `plans/**`) | `ci-docs`           | install, format only                               |
| release-please branch                     | `ci-release-pr`     | install, format only                               |
| Any PR                                    | `dependency-review` | PR diff scanned for new high+ vulnerabilities      |

Path logic matches [auto-label-docs.yml](../.github/workflows/auto-label-docs.yml): full `ci` is skipped only when the PR is **truly docs-only** (docs paths changed and no code paths).

### `pnpm audit` vs Dependency Review

| Check                           | Scope                              | When                   |
| ------------------------------- | ---------------------------------- | ---------------------- |
| `pnpm audit --audit-level high` | Entire lockfile                    | `ci` job after install |
| `dependency-review-action`      | Dependencies **changed in the PR** | Every PR               |

Both are intentional — audit ensures the repo is clean; dependency review catches regressions introduced by the PR.

### Other PR jobs (hygiene)

| Job                      | Purpose                                        |
| ------------------------ | ---------------------------------------------- |
| `branch-name`            | Enforces `type/scope-description` branch names |
| `pr-title`               | Semantic PR title (squash-merge message)       |
| `validate-release-files` | Blocks manual edits to release-please files    |

### Push to `main`

The `ci` job also runs on push to `main` (re-validates after merge). Overlaps with PR CI by design.

---

## GitHub Actions pinning

All workflow `uses:` references are pinned to **full commit SHAs** with a version comment:

```yaml
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
```

Read-only CI jobs set `persist-credentials: false` on checkout. Changelog workflows keep credentials — they push formatted changelogs.

Workflows: `ci.yml`, `changelog-api.yml`, `changelog-web.yml`, `auto-label-docs.yml`.

[Renovate](#renovate) keeps digests updated via `helpers:pinGitHubActionDigests`.

---

## Renovate

Config: [`renovate.json`](../renovate.json).

### Setup (one-time)

1. Install the [Renovate GitHub App](https://github.com/apps/renovate) on the repository.
2. **Close** the onboarding PR (`renovate/configure`) if Renovate opens one — this repo already ships a full `renovate.json` via the supply-chain PR.
3. Renovate reads `renovate.json` on `main` and opens weekly update PRs (Mondays before 9am).

### Grouping

| Group              | Packages                                         |
| ------------------ | ------------------------------------------------ |
| `dev-dependencies` | Root devDeps, patch/minor                        |
| `prisma`           | `prisma`, `@prisma/client`, `@prisma/adapter-pg` |
| `react`            | `react`, `react-dom`, `react-router-dom`         |
| `vite`             | `vite`, `@vitejs/plugin-react`                   |
| `github-actions`   | Workflow action updates + SHA refresh            |

`minimumReleaseAge` may delay installing brand-new versions Renovate proposes. For urgent security fixes, use `pnpm audit --fix` (adds patched versions to `minimumReleaseAgeExclude`) or add a manual exclusion.

Renovate PRs use `renovate/*` branches and are exempt from `branch-name` / `pr-title` / `validate-release-files` (same pattern as `release-please--*`).

---

## Local hooks (intentional overlap)

| Check            | pre-push hook | CI               |
| ---------------- | ------------- | ---------------- |
| Branch name      | yes           | `branch-name`    |
| Prettier         | yes           | `ci` / `ci-docs` |
| Lint / typecheck | no            | `ci`             |

Hooks give fast feedback; CI is the merge gate.

---

## Post-merge checklist

- [ ] Install Renovate GitHub App
- [ ] Close `renovate/configure` onboarding PR if still open
- [ ] `corepack prepare pnpm@11.5.2 --activate` on dev machines
- [ ] Optional: **Settings → Security → Advanced Security** — enable Dependency graph + Dependabot alerts
- [ ] Optional: branch protection — require `ci` and `dependency-review` on `main`

---

## Troubleshooting

### `ERR_PNPM_TRUST_DOWNGRADE`

A package version lacks trust evidence that older versions had. Options:

1. Add to `trustPolicyExclude` (specific version)
2. Wait for a properly signed release
3. Remove `trustPolicy` (not recommended)

### `ERR_PNPM_IGNORED_BUILDS`

A dependency needs a postinstall script but is not in `allowBuilds`. Add `packagename: true` to `pnpm-workspace.yaml`.

### `ERR_PNPM_LOCKFILE_RESOLUTION_VERIFICATION`

Lockfile entries violate `minimumReleaseAge` or `trustPolicy`. Run:

```bash
pnpm clean --lockfile
pnpm install
```

### Renovate PR fails CI

Run locally: `pnpm install --frozen-lockfile && pnpm audit --audit-level high && pnpm validate && pnpm build`. Merge the supply-chain PR before expecting Renovate onboarding PRs to pass.

### Commit scope rejected

Commitlint scopes are `api`, `web`, `mobile`, `shared`, `tooling`, `data`, `repo` — not `ci`. Use `fix(repo):` in commit messages; PR titles use `ci(repo):` for the type.
