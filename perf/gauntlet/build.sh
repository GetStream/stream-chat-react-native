#!/bin/bash
# build.sh <label> <repo-root> [diag] — release APK (arm64-v8a) for one side of a comparison: THIS checkout's
# native project + <repo-root>'s SampleApp JS bundle through the gauntlet Metro config (probe, profiling
# renderer, 100-message patch, kept fn names). Output: out/apk/<label>.apk (+ .hbc for checks).
# `diag` builds a DIAGNOSTIC variant (areEqual logging, hook counts, context-change tracking): never use
# a diag APK for measured numbers.
# First build of the native project: 10-15 min. Later builds only rebundle JS: ~1-2 min each.
set -euo pipefail
G=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$G/../.." && pwd)
LABEL=${1:?usage: build.sh <label> <repo-root> [diag]}; ROOT=$(cd "${2:?usage}" && pwd); MODE=${3:-}
APP="$ROOT/examples/SampleApp"
[ -f "$G/runtime/generated/ChatUsers.gauntlet.ts" ] || { echo "run tokens.cjs first"; exit 1; }
node "$G/check-native-parity.cjs" "$REPO" "$ROOT"
mkdir -p "$G/out/apk"
cd "$REPO/examples/SampleApp/android"
rm -rf app/build/generated/assets/createBundleReleaseJsAndAssets app/build/generated/res/createBundleReleaseJsAndAssets \
  app/build/intermediates/sourcemaps/react/release app/build/outputs/apk/release
if [ "$MODE" = diag ]; then export GAUNTLET_DIAG=1; else unset GAUNTLET_DIAG; fi
GAUNTLET_APP=$APP GAUNTLET_DIR=$G ./gradlew assembleRelease --init-script "$G/gauntlet.init.gradle" \
  -PreactNativeArchitectures=arm64-v8a > "$G/out/apk/$LABEL.build.log" 2>&1
cp app/build/outputs/apk/release/app-release.apk "$G/out/apk/$LABEL.apk"
unzip -p "$G/out/apk/$LABEL.apk" assets/index.android.bundle > "$G/out/apk/$LABEL.hbc"
# (strings to a file first: with pipefail, `strings | grep -q` fails on SIGPIPE when grep exits early)
strings "$G/out/apk/$LABEL.hbc" > "$G/out/apk/$LABEL.strings"
for s in 'BENCH ' 'probe installed' 'llc probe installed'; do
  grep -q "$s" "$G/out/apk/$LABEL.strings" || { echo "MISSING in bundle: $s"; exit 1; }
done
md5 -q "$G/out/apk/$LABEL.apk" > "$G/out/apk/$LABEL.md5" 2>/dev/null || md5sum "$G/out/apk/$LABEL.apk" | cut -d' ' -f1 > "$G/out/apk/$LABEL.md5"
echo "built out/apk/$LABEL.apk from $ROOT${MODE:+ ($MODE)}"
