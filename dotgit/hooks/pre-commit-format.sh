#!/usr/bin/env bash

# Lints only the staged files, so a commit takes seconds instead of a full-repo `yarn lint`.
# CI (check-pr.yml) still runs the full `yarn lint`.

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

PRETTIER="node_modules/.bin/prettier"
ESLINT="node_modules/.bin/eslint"

# Staged files that still exist (added, copied, modified, renamed). Bash 3.2 has no mapfile.
staged=()
while IFS= read -r -d '' file; do
  staged+=("$file")
done < <(git diff --cached --name-only --diff-filter=ACMR -z)

if [ "${#staged[@]}" -eq 0 ]; then
  exit 0
fi

lintable=()
touches_package=false
for file in "${staged[@]}"; do
  case "$file" in
    *.js | *.jsx | *.ts | *.tsx | *.mjs | *.cjs) lintable+=("$file") ;;
  esac
  case "$file" in
    package/*) touches_package=true ;;
  esac
done

run_checks() {
  # --ignore-unknown: skip files Prettier has no parser for. .prettierignore still applies.
  "$PRETTIER" --list-different --ignore-unknown "${staged[@]}" || return 1

  if [ "${#lintable[@]}" -gt 0 ]; then
    # --no-warn-ignored: files excluded by the ESLint config would otherwise count as warnings.
    "$ESLINT" --max-warnings 0 --no-warn-ignored --cache --cache-location node_modules/.cache/eslint/ \
      "${lintable[@]}" || return 1
  fi

  # Both validators only read the SDK package, and take about a second each.
  if [ "$touches_package" = true ]; then
    yarn workspace stream-chat-react-native-core validate-translations || return 1
    yarn workspace stream-chat-react-native-core validate-entry-isolation || return 1
  fi
}

if ! run_checks; then
  "$PRETTIER" --write --ignore-unknown "${staged[@]}" >/dev/null || true
  if [ "${#lintable[@]}" -gt 0 ]; then
    "$ESLINT" --fix --no-warn-ignored --cache --cache-location node_modules/.cache/eslint/ \
      "${lintable[@]}" >/dev/null || true
  fi
  echo "some files were not formatted correctly (prettier/eslint) commit aborted!"
  echo "your changes are still staged, you can accept formatting changes with git add or ignore them by adding --no-verify to git commit"
  exit 1
fi
