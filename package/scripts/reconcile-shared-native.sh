#!/usr/bin/env bash

set -euo pipefail

TARGET="${1:-all}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_DIR="$ROOT_DIR/shared-native/.sync-state"
SHARED_ANDROID_DIR="$ROOT_DIR/shared-native/android"
SHARED_IOS_DIR="$ROOT_DIR/shared-native/ios"

sync_dir_contents() {
  local src_dir="$1"
  local dst_dir="$2"

  mkdir -p "$dst_dir"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$src_dir"/ "$dst_dir"/
  else
    find "$dst_dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    cp -R "$src_dir"/. "$dst_dir"/
  fi
}

hash_manifest_for_dir() {
  local dir="$1"
  local manifest_path="$2"

  mkdir -p "$(dirname "$manifest_path")"
  : > "$manifest_path"

  if [ ! -d "$dir" ]; then
    return
  fi

  while IFS= read -r file; do
    local rel_path="${file#$dir/}"
    local hash
    hash="$(shasum "$file" | awk '{print $1}')"
    printf "%s\t%s\n" "$rel_path" "$hash" >> "$manifest_path"
  done < <(find "$dir" -type f | LC_ALL=C sort)
}

hash_for_path() {
  local manifest_path="$1"
  local rel_path="$2"
  awk -F '\t' -v path="$rel_path" '$1 == path { print $2; found=1; exit } END { if (!found) print "-" }' "$manifest_path"
}

sync_platform_with_conflict_detection() {
  local package_name="$1"
  local platform_name="$2"
  local package_dir="$3"
  local shared_dir="$4"

  mkdir -p "$STATE_DIR"
  mkdir -p "$package_dir" "$shared_dir"

  local baseline_manifest="$STATE_DIR/${package_name}_${platform_name}.manifest"
  local tmp_baseline_manifest
  local tmp_shared_manifest
  local tmp_package_manifest
  local tmp_union_paths
  local tmp_conflicts

  tmp_baseline_manifest="$(mktemp)"
  tmp_shared_manifest="$(mktemp)"
  tmp_package_manifest="$(mktemp)"
  tmp_union_paths="$(mktemp)"
  tmp_conflicts="$(mktemp)"

  if [ -f "$baseline_manifest" ]; then
    cp "$baseline_manifest" "$tmp_baseline_manifest"
  fi

  hash_manifest_for_dir "$shared_dir" "$tmp_shared_manifest"
  hash_manifest_for_dir "$package_dir" "$tmp_package_manifest"

  cat "$tmp_baseline_manifest" "$tmp_shared_manifest" "$tmp_package_manifest" \
    | awk -F '\t' 'NF > 0 { print $1 }' \
    | LC_ALL=C sort -u > "$tmp_union_paths"

  local shared_changed=0
  local package_changed=0
  local conflict_count=0

  while IFS= read -r rel_path; do
    [ -z "$rel_path" ] && continue

    local baseline_hash
    local shared_hash
    local package_hash
    baseline_hash="$(hash_for_path "$tmp_baseline_manifest" "$rel_path")"
    shared_hash="$(hash_for_path "$tmp_shared_manifest" "$rel_path")"
    package_hash="$(hash_for_path "$tmp_package_manifest" "$rel_path")"

    if [ "$shared_hash" != "$baseline_hash" ]; then
      shared_changed=1
    fi
    if [ "$package_hash" != "$baseline_hash" ]; then
      package_changed=1
    fi

    if [ "$shared_hash" != "$package_hash" ] && [ "$shared_hash" != "$baseline_hash" ] && [ "$package_hash" != "$baseline_hash" ]; then
      conflict_count=$((conflict_count + 1))
      printf "%s (shared-native=%s, package=%s, baseline=%s)\n" \
        "$rel_path" "$shared_hash" "$package_hash" "$baseline_hash" >> "$tmp_conflicts"
    fi
  done < "$tmp_union_paths"

  if [ "$conflict_count" -gt 0 ]; then
    echo "Conflict detected for $package_name [$platform_name]."
    echo "Both shared-native and package mirror changed the same file(s) differently since last sync:"
    cat "$tmp_conflicts"
    rm -f "$tmp_baseline_manifest" "$tmp_shared_manifest" "$tmp_package_manifest" "$tmp_union_paths" "$tmp_conflicts"
    return 1
  fi

  if [ "$package_changed" -eq 1 ] && [ "$shared_changed" -eq 0 ]; then
    sync_dir_contents "$package_dir" "$shared_dir"
    echo "Applied $platform_name sync direction: package -> shared-native ($package_name)"
  elif [ "$shared_changed" -eq 1 ] && [ "$package_changed" -eq 0 ]; then
    sync_dir_contents "$shared_dir" "$package_dir"
    echo "Applied $platform_name sync direction: shared-native -> package ($package_name)"
  fi

  hash_manifest_for_dir "$shared_dir" "$baseline_manifest"
  rm -f "$tmp_baseline_manifest" "$tmp_shared_manifest" "$tmp_package_manifest" "$tmp_union_paths" "$tmp_conflicts"
}

sync_from_package() {
  local package_name="$1"
  local android_package_dir="$ROOT_DIR/$package_name/android/src/main/java/com/streamchatreactnative/shared"
  local ios_package_dir="$ROOT_DIR/$package_name/ios/shared"

  sync_platform_with_conflict_detection \
    "$package_name" \
    "android" \
    "$android_package_dir" \
    "$SHARED_ANDROID_DIR"

  sync_platform_with_conflict_detection \
    "$package_name" \
    "ios" \
    "$ios_package_dir" \
    "$SHARED_IOS_DIR"
}

case "$TARGET" in
  native-package)
    sync_from_package "native-package"
    ;;
  expo-package)
    sync_from_package "expo-package"
    ;;
  all)
    # Prefer native-package when both are present.
    if [ -d "$ROOT_DIR/native-package/android/src/main/java/com/streamchatreactnative/shared" ] || [ -d "$ROOT_DIR/native-package/ios/shared" ]; then
      sync_from_package "native-package"
    elif [ -d "$ROOT_DIR/expo-package/android/src/main/java/com/streamchatreactnative/shared" ] || [ -d "$ROOT_DIR/expo-package/ios/shared" ]; then
      sync_from_package "expo-package"
    else
      echo "No package shared native sources found to sync from"
      exit 1
    fi
    ;;
  *)
    echo "Unknown target: $TARGET"
    echo "Expected one of: native-package, expo-package, all"
    exit 1
    ;;
esac

echo "Reconciled package/shared-native directories with conflict checks for target: $TARGET"
