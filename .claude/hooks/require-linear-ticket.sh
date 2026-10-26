#!/usr/bin/env bash
# PreToolUse hook: block PR creation unless a Linear ticket ID is present in
# the PR title or PR body. The branch name does not count.
#
# Acts on:
#   - Bash commands that run `gh pr create` (or its alias `gh pr new`)
#   - MCP tools whose name looks like a PR-creation tool
#     (e.g. mcp__github__create_pull_request)
# Every other tool call exits 0.
#
# Team keys default to RN; override with LINEAR_TEAM_KEYS="A B C".
# If LINEAR_API_KEY is set, the ticket is also verified against Linear's API.
#
# Requires: bash, jq, curl.

set -uo pipefail

TEAM_KEYS="${LINEAR_TEAM_KEYS:-RN}"
KEYS_ALT="$(echo "$TEAM_KEYS" | tr -s ' ,' '|' | sed 's/^|//; s/|$//')"
MCP_PR_TOOL_RE='^mcp__.*(create_pull_request|create_pr|pull_request_create|open_pull_request)'
GH_PR_CREATE_RE='(^|[;&|(`]|\$\()[[:space:]]*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*gh[[:space:]]+pr[[:space:]]+(create|new)([[:space:]]|$)'

input="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
  # Without jq we can't parse the payload; only block if this looks like PR creation.
  if printf '%s' "$input" | grep -qE 'gh[[:space:]]+pr[[:space:]]+(create|new)|create_pull_request'; then
    echo "require-linear-ticket hook: jq is not installed, so the Linear ticket check cannot run. Install jq (e.g. 'brew install jq') and retry." >&2
    exit 2
  fi
  exit 0
fi

tool_name="$(printf '%s' "$input" | jq -r '.tool_name // empty')"
cwd="$(printf '%s' "$input" | jq -r '.cwd // empty')"
[ -n "$cwd" ] && [ -d "$cwd" ] || cwd="${CLAUDE_PROJECT_DIR:-$PWD}"

haystack=""

if [ "$tool_name" = "Bash" ]; then
  cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
  printf '%s\n' "$cmd" | grep -qE "$GH_PR_CREATE_RE" || exit 0

  # The inline title/body (including heredocs) are part of the command string.
  # Scan from `gh pr create` onward, so earlier commands (e.g. `git switch -c
  # react-123-...`) don't count, and drop the branch/repo flag values.
  haystack="$(printf '%s\n' "$cmd" \
    | awk 'found { print; next } match($0, /gh[[:space:]]+pr[[:space:]]+(create|new)/) { print substr($0, RSTART); found = 1 }' \
    | sed -E 's/(^|[[:space:]])(--head|-H|--base|-B|--repo|-R)([= ]+)("[^"]*"|'\''[^'\'']*'\''|[^[:space:]]+)/\1/g')"

  # --body-file/-F <path>
  body_file="$(printf '%s' "$cmd" | grep -oE -- '(--body-file|-F)[= ]+[^[:space:]]+' | head -n1 | sed -E 's/^(--body-file|-F)[= ]+//; s/["'\'']//g')"
  if [ -n "$body_file" ] && [ "$body_file" != "-" ]; then
    case "$body_file" in /*) ;; *) body_file="$cwd/$body_file" ;; esac
    [ -f "$body_file" ] && haystack="$haystack"$'\n'"$(cat "$body_file")"
  fi
elif printf '%s' "$tool_name" | grep -qiE "$MCP_PR_TOOL_RE"; then
  haystack="$(printf '%s' "$input" | jq -r '[.tool_input.title, .tool_input.body] | map(select(. != null) | tostring) | join("\n")')"
else
  exit 0
fi

ids="$(printf '%s\n' "$haystack" \
  | grep -oiE "(^|[^[:alnum:]])($KEYS_ALT)-[0-9]+" \
  | grep -oiE "($KEYS_ALT)-[0-9]+" \
  | tr '[:lower:]' '[:upper:]' | awk '!seen[$0]++')"

if [ -z "$ids" ]; then
  cat >&2 <<EOF
Blocked: no Linear ticket ID found for this pull request.

Checked the PR title and PR body for an ID matching one of the team keys:
${TEAM_KEYS} (e.g. RN-123). The branch name does not count.

Before opening the PR:
  1. Find the existing Linear ticket for this work, or create one in the RN team.
  2. Put its ID in the PR title or PR body
     (e.g. 'Ticket: https://linear.app/stream/issue/RN-123').
  3. Retry creating the PR.
EOF
  exit 2
fi

# Optional verification against Linear. Skipped silently when no key is set.
if [ -n "${LINEAR_API_KEY:-}" ]; then
  found=""
  for id in $ids; do
    payload="$(jq -nc --arg id "$id" '{query: "query($id: String!) { issue(id: $id) { id } }", variables: {id: $id}}')"
    resp="$(curl -sS --max-time 10 -X POST https://api.linear.app/graphql \
      -H "Content-Type: application/json" \
      -H "Authorization: ${LINEAR_API_KEY}" \
      --data "$payload" 2>/dev/null)" || {
      echo "require-linear-ticket hook: could not reach Linear to verify $id; allowing." >&2
      exit 0
    }
    if printf '%s' "$resp" | jq -e '.data.issue.id // empty' >/dev/null 2>&1; then
      found="$id"
      break
    fi
    # Only a "not found" answer counts against the ticket; auth errors or
    # unexpected responses mean we can't verify, so don't block on them.
    if ! printf '%s' "$resp" | jq -e '[.errors[]?.message] | any(test("not found"; "i"))' >/dev/null 2>&1; then
      msg="$(printf '%s' "$resp" | jq -r '.errors[0].message // "unexpected response"' 2>/dev/null)"
      echo "require-linear-ticket hook: could not verify $id with Linear (${msg:-unexpected response}); allowing." >&2
      exit 0
    fi
  done
  if [ -z "$found" ]; then
    cat >&2 <<EOF
Blocked: Linear ticket ID(s) $(echo $ids | tr ' ' ',') were found, but none exist in Linear.

Find or create the correct Linear ticket and put its real ID in the PR title or PR body, then retry.
EOF
    exit 2
  fi
fi

exit 0
