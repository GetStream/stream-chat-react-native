#!/usr/bin/env bash

set -euo pipefail

TARGET="${1:-all}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/shared-native/android/src/main/java/com/streamchatreactnative"

copy_to_package() {
  local package_name="$1"
  local dst_dir="$ROOT_DIR/$package_name/android/src/main/java/com/streamchatreactnative"
  mkdir -p "$dst_dir"
  cp "$SRC_DIR/StreamShimmerFrameLayout.kt" "$dst_dir/StreamShimmerFrameLayout.kt"
  cp "$SRC_DIR/StreamShimmerViewManager.kt" "$dst_dir/StreamShimmerViewManager.kt"
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
