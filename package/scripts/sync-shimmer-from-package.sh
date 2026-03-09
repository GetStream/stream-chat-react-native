#!/usr/bin/env bash

set -euo pipefail

TARGET="${1:-all}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
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

has_content() {
  local dir="$1"
  [ -d "$dir" ] && [ -n "$(find "$dir" -mindepth 1 -print -quit)" ]
}

sync_from_package() {
  local package_name="$1"
  local android_src_dir="$ROOT_DIR/$package_name/android/src/main/java/com/streamchatreactnative/shared"
  local ios_src_dir="$ROOT_DIR/$package_name/ios/shared"

  mkdir -p "$SHARED_ANDROID_DIR" "$SHARED_IOS_DIR"

  if has_content "$android_src_dir"; then
    sync_dir_contents "$android_src_dir" "$SHARED_ANDROID_DIR"
  else
    echo "Skipping Android reverse sync for $package_name: no files in $android_src_dir"
  fi

  if has_content "$ios_src_dir"; then
    sync_dir_contents "$ios_src_dir" "$SHARED_IOS_DIR"
  else
    echo "Skipping iOS reverse sync for $package_name: no files in $ios_src_dir"
  fi
}

case "$TARGET" in
  native-package)
    sync_from_package "native-package"
    ;;
  expo-package)
    sync_from_package "expo-package"
    ;;
  all)
    # Prefer native-package as source if both are present.
    if has_content "$ROOT_DIR/native-package/android/src/main/java/com/streamchatreactnative/shared" || has_content "$ROOT_DIR/native-package/ios/shared"; then
      sync_from_package "native-package"
    elif has_content "$ROOT_DIR/expo-package/android/src/main/java/com/streamchatreactnative/shared" || has_content "$ROOT_DIR/expo-package/ios/shared"; then
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

echo "Synchronized shared native directories from package mirror to shared-native for target: $TARGET"
