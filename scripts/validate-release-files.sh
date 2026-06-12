#!/usr/bin/env bash
set -euo pipefail

validate_ref() {
  local ref="$1"
  if [[ ! "${ref}" =~ ^[a-zA-Z0-9/._-]+$ ]]; then
    echo "Invalid git ref: ${ref}"
    exit 1
  fi
}

BASE="${BASE_REF:-${1:-main}}"
HEAD="${HEAD_REF:-${2:-HEAD}}"

validate_ref "${BASE}"
validate_ref "${HEAD}"

if git rev-parse --verify "origin/${BASE}" >/dev/null 2>&1; then
  RANGE="origin/${BASE}...${HEAD}"
else
  RANGE="${BASE}...${HEAD}"
fi

HEAD_BRANCH="${HEAD}"
if [[ "${HEAD_BRANCH}" == "HEAD" ]]; then
  HEAD_BRANCH="$(git branch --show-current)"
fi

# Manual app changelog edits allowed on docs/* branches (e.g. docs/repo-v1-changelogs).
ALLOW_MANUAL_APP_CHANGELOGS=0
if [[ "${HEAD_BRANCH}" == docs/* ]]; then
  ALLOW_MANUAL_APP_CHANGELOGS=1
fi

FAILED=0

while IFS= read -r file; do
  [[ -z "${file}" ]] && continue

  if [[ "${file}" == apps/api/CHANGELOG.md || "${file}" == apps/web/CHANGELOG.md ]]; then
    if [[ "${ALLOW_MANUAL_APP_CHANGELOGS}" -eq 1 ]]; then
      continue
    fi
    echo "Blocked: ${file}"
    echo "  App changelogs: use release-please, or a docs/* branch for manual release notes."
    FAILED=1
  elif [[ "${file}" =~ ^\.github/release-please/.*-manifest\.json$ ]]; then
    echo "Blocked: ${file}"
    echo "  Release manifests are updated by release-please only."
    FAILED=1
  fi
done < <(git diff --name-only "${RANGE}" 2>/dev/null || true)

if [[ "${FAILED}" -eq 1 ]]; then
  echo ""
  echo "Do not edit release files in feature PRs."
  echo "Merge your change, then merge the Release PR from release-please."
  exit 1
fi
