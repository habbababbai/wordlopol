#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-$(git branch --show-current)}"

# Protected / release / bot branches — no naming rule
if [[ "$BRANCH" == "main" ]] \
  || [[ "$BRANCH" =~ ^release/[0-9]+\.[0-9]+\.[0-9]+$ ]] \
  || [[ "$BRANCH" =~ ^release-please-- ]] \
  || [[ "$BRANCH" =~ ^renovate/ ]]; then
  exit 0
fi

# <type>/<scope>-<description>
# e.g. feat/api-add-auth, fix/web-keyboard, chore/repo-husky-setup
PATTERN='^(feat|fix|docs|style|refactor|test|chore|ci|build|perf|revert)/(api|web|mobile|shared|tooling|data|repo)-[a-z0-9]+(-[a-z0-9]+)*$'

if [[ ! "$BRANCH" =~ $PATTERN ]]; then
  echo ""
  echo "Invalid branch name: ${BRANCH}"
  echo ""
  echo "Expected format:  <type>/<scope>-<description>"
  echo "Examples:"
  echo "  feat/api-add-auth"
  echo "  fix/web-keyboard"
  echo "  chore/repo-husky-setup"
  echo ""
  echo "Types:  feat fix docs style refactor test chore ci build perf revert"
  echo "Scopes: api web mobile shared tooling data repo"
  echo ""
  echo "See docs/CONTRIBUTING.md for details."
  exit 1
fi
