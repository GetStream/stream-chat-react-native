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

copy_to_package() {
  local package_name="$1"
  local android_dst_dir="$ROOT_DIR/$package_name/android/src/main/java/com/streamchatreactnative/shared"
  local ios_dst_dir="$ROOT_DIR/$package_name/ios/shared"

  if [ -d "$SHARED_ANDROID_DIR" ]; then
    sync_dir_contents "$SHARED_ANDROID_DIR" "$android_dst_dir"
  else
    echo "Skipping Android sync: missing $SHARED_ANDROID_DIR"
  fi

  if [ -d "$SHARED_IOS_DIR" ]; then
    sync_dir_contents "$SHARED_IOS_DIR" "$ios_dst_dir"
  else
    echo "Skipping iOS sync: missing $SHARED_IOS_DIR"
  fi
}

case "$TARGET" in
  native-package)
    copy_to_package "native-package"
    ;;
  expo-package)
    copy_to_package "expo-package"
    ;;
  all)
    copy_to_package "native-package"
    copy_to_package "expo-package"
    ;;
  *)
    echo "Unknown target: $TARGET"
    echo "Expected one of: native-package, expo-package, all"
    exit 1
    ;;
esac

echo "Synchronized shared native directories for target: $TARGET"
