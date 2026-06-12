# Supply chain

pnpm 11 supply-chain settings for the monorepo. Config lives in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml).

## Policies

| Setting                   | Value            | Effect                                                                          |
| ------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `minimumReleaseAge`       | `1440` (minutes) | New npm versions must be at least ~24h old before install                       |
| `minimumReleaseAgeStrict` | `true`           | Applies to all dependencies                                                     |
| `trustPolicy`             | `no-downgrade`   | Blocks installs when package trust would downgrade                              |
| `allowBuilds`             | allowlist        | Only listed packages may run install scripts (`bcrypt`, `prisma`, `esbuild`, …) |

## CI

- `pnpm audit` in the main CI workflow
- GitHub **Dependency Review** on pull requests (fails on high severity)
- GitHub Actions pinned to commit SHAs; **Renovate** for dependency and action updates

## Overrides

`pnpm-workspace.yaml` also pins vulnerable transitive versions (e.g. `tar`, `@hono/node-server`) via `overrides`.
