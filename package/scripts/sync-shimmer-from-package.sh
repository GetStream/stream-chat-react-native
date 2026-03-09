#!/usr/bin/env bash

set -euo pipefail

TARGET="${1:-all}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SHARED_ANDROID_DIR="$ROOT_DIR/shared-native/android/src/main/java/com/streamchatreactnative"
SHARED_IOS_DIR="$ROOT_DIR/shared-native/ios"

ANDROID_FILES=(
  "StreamShimmerFrameLayout.kt"
  "StreamShimmerViewManager.kt"
)
IOS_FILES=(
  "StreamShimmerViewComponentView.h"
  "StreamShimmerViewComponentView.mm"
  "StreamShimmerView.swift"
)

copy_file() {
  local src_file="$1"
  local dst_file="$2"
  if [ -e "$dst_file" ]; then
    local src_inode
    local dst_inode
    src_inode=$(stat -f %i "$src_file" 2>/dev/null || echo "")
    dst_inode=$(stat -f %i "$dst_file" 2>/dev/null || echo "")
    if [ -n "$src_inode" ] && [ "$src_inode" = "$dst_inode" ]; then
      return
    fi
  fi
  cp "$src_file" "$dst_file"
}

sync_from_package() {
  local package_name="$1"
  local android_src_dir="$ROOT_DIR/$package_name/android/src/main/java/com/streamchatreactnative"
  local ios_src_dir="$ROOT_DIR/$package_name/ios"
  local missing=0

  mkdir -p "$SHARED_ANDROID_DIR" "$SHARED_IOS_DIR"

  for filename in "${ANDROID_FILES[@]}"; do
    local src_file="$android_src_dir/$filename"
    local dst_file="$SHARED_ANDROID_DIR/$filename"
    if [ ! -f "$src_file" ]; then
      echo "Missing Android shimmer source in $package_name (skipping reverse sync): $src_file"
      missing=1
      continue
    fi
    copy_file "$src_file" "$dst_file"
  done

  for filename in "${IOS_FILES[@]}"; do
    local src_file="$ios_src_dir/$filename"
    local dst_file="$SHARED_IOS_DIR/$filename"
    if [ ! -f "$src_file" ]; then
      echo "Missing iOS shimmer source in $package_name (skipping reverse sync): $src_file"
      missing=1
      continue
    fi
    copy_file "$src_file" "$dst_file"
  done

  if [ "$missing" -eq 1 ]; then
    return 0
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
    if [ -f "$ROOT_DIR/native-package/ios/StreamShimmerView.swift" ]; then
      sync_from_package "native-package"
    elif [ -f "$ROOT_DIR/expo-package/ios/StreamShimmerView.swift" ]; then
      sync_from_package "expo-package"
    else
      echo "No package shimmer sources found to sync from"
      exit 1
    fi
    ;;
  *)
    echo "Unknown target: $TARGET"
    echo "Expected one of: native-package, expo-package, all"
    exit 1
    ;;
esac

echo "Synchronized shimmer native files from package mirror to shared-native for target: $TARGET"
