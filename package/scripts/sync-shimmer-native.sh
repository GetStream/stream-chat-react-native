#!/usr/bin/env bash

set -euo pipefail

TARGET="${1:-all}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_SRC_DIR="$ROOT_DIR/shared-native/android/src/main/java/com/streamchatreactnative"
IOS_SRC_DIR="$ROOT_DIR/shared-native/ios"

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
  rm -f "$dst_file"
  cp "$src_file" "$dst_file"
}

copy_to_package() {
  local package_name="$1"
  local android_dst_dir="$ROOT_DIR/$package_name/android/src/main/java/com/streamchatreactnative"
  local ios_dst_dir="$ROOT_DIR/$package_name/ios"

  mkdir -p "$android_dst_dir"
  copy_file "$ANDROID_SRC_DIR/StreamShimmerFrameLayout.kt" "$android_dst_dir/StreamShimmerFrameLayout.kt"
  copy_file "$ANDROID_SRC_DIR/StreamShimmerViewManager.kt" "$android_dst_dir/StreamShimmerViewManager.kt"

  mkdir -p "$ios_dst_dir"
  copy_file "$IOS_SRC_DIR/StreamShimmerViewComponentView.h" "$ios_dst_dir/StreamShimmerViewComponentView.h"
  copy_file "$IOS_SRC_DIR/StreamShimmerViewComponentView.mm" "$ios_dst_dir/StreamShimmerViewComponentView.mm"
  copy_file "$IOS_SRC_DIR/StreamShimmerView.swift" "$ios_dst_dir/StreamShimmerView.swift"
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

echo "Synchronized shimmer native files for target: $TARGET"
