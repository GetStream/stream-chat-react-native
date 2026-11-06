#!/bin/bash
# export-ref.sh <git-ref> <label> — exports <git-ref> (e.g. origin/develop) into out/trees/<label> with
# `git archive` (read-only: no worktree, no checkout, no git writes) and installs its dependencies.
# ~1-3 min. Records the exact sha in out/trees/<label>.sha.
set -euo pipefail
G=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$G/../.." && pwd)
REF=${1:?usage: export-ref.sh <git-ref> <label>}; LABEL=${2:?usage: export-ref.sh <git-ref> <label>}
DEST="$G/out/trees/$LABEL"
[ -e "$DEST" ] && { echo "$DEST exists; reuse it or pick another label"; exit 1; }
mkdir -p "$DEST"
git -C "$REPO" archive "$REF" | tar -x -C "$DEST"
git -C "$REPO" rev-parse "$REF" > "$G/out/trees/$LABEL.sha"
(cd "$DEST" && HUSKY=0 yarn install > "$G/out/trees/$LABEL-install.log" 2>&1)
echo "exported $REF ($(cat "$G/out/trees/$LABEL.sha")) to $DEST"
