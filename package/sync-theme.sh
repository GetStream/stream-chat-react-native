#!/usr/bin/env bash
set -euo pipefail

DEST="src/theme/generated"
DEFAULT_SRC="../../design-system-tokens/build/reactnative"
FALLBACK_SRC="${1:-}"

# Pick a source, while preferring DEFAULT_SRC if it exists; otherwise use fallback arg (if provided)
if [[ -d "$DEFAULT_SRC" ]]; then
  SRC="$DEFAULT_SRC"
elif [[ -n "$FALLBACK_SRC" && -d "$FALLBACK_SRC" ]]; then
  SRC="$FALLBACK_SRC"
else
  echo "Error: Source directory not found."
  echo "Tried: $DEFAULT_SRC"
  [[ -n "$FALLBACK_SRC" ]] && echo "Also tried fallback arg: $FALLBACK_SRC"
  exit 1
fi

mkdir -p "$DEST"

# Clear DEST contents (but keep the folder itself)
rm -rf "$DEST"/* "$DEST"/.[!.]* "$DEST"/..?* 2>/dev/null || true

# Copy contents of SRC into DEST
cp -R "$SRC"/. "$DEST"/

prettier --write "$DEST"

echo "Copied theme tokens from: $SRC -> $DEST"
