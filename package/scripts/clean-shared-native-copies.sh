#!/usr/bin/env bash

set -euo pipefail

TARGET="${1:-all}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

clean_package() {
  local package_name="$1"
  local android_dir="$ROOT_DIR/$package_name/android/src/main/java/com/streamchatreactnative/shared"
  local ios_dir="$ROOT_DIR/$package_name/ios/shared"

  rm -rf "$android_dir" "$ios_dir"
}

case "$TARGET" in
  native-package)
    clean_package "native-package"
    ;;
  expo-package)
    clean_package "expo-package"
    ;;
  all)
    clean_package "native-package"
    clean_package "expo-package"
    ;;
  *)
    echo "Unknown target: $TARGET"
    echo "Expected one of: native-package, expo-package, all"
    exit 1
    ;;
esac

echo "Cleaned generated shared native copies for target: $TARGET"
