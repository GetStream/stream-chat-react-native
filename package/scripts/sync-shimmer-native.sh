#!/usr/bin/env bash

set -euo pipefail

TARGET="${1:-all}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_SRC_DIR="$ROOT_DIR/shared-native/android/src/main/java/com/streamchatreactnative"
IOS_SRC_DIR="$ROOT_DIR/shared-native/ios"

copy_to_package() {
  local package_name="$1"
  local android_dst_dir="$ROOT_DIR/$package_name/android/src/main/java/com/streamchatreactnative"
  local ios_dst_dir="$ROOT_DIR/$package_name/ios"

  mkdir -p "$android_dst_dir"
  cp "$ANDROID_SRC_DIR/StreamShimmerFrameLayout.kt" "$android_dst_dir/StreamShimmerFrameLayout.kt"
  cp "$ANDROID_SRC_DIR/StreamShimmerViewManager.kt" "$android_dst_dir/StreamShimmerViewManager.kt"

  mkdir -p "$ios_dst_dir"
  cp "$IOS_SRC_DIR/StreamShimmerViewComponentView.h" "$ios_dst_dir/StreamShimmerViewComponentView.h"
  cp "$IOS_SRC_DIR/StreamShimmerViewComponentView.mm" "$ios_dst_dir/StreamShimmerViewComponentView.mm"
  cp "$IOS_SRC_DIR/StreamShimmerView.swift" "$ios_dst_dir/StreamShimmerView.swift"
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
