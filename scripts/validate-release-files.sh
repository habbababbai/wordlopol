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

FAILED=0

while IFS= read -r file; do
  [[ -z "${file}" ]] && continue

  if [[ "${file}" == apps/api/CHANGELOG.md || "${file}" == apps/web/CHANGELOG.md ]]; then
    echo "Blocked: ${file}"
    echo "  App changelogs are updated by release-please Release PRs only."
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
