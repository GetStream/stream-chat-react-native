#!/usr/bin/env bash
#
# Drive the SampleApp into a channel and scroll, waiting on REAL mount signals
# (testIDs in the view hierarchy) instead of fixed sleeps — on Android debug,
# navigation is slow and variable, so sleeping a fixed amount races the mount.
#
# Signals used:
#   channel-list-view        -> the channel list is rendered (ready to tap)
#   channel-preview-button   -> a channel row (we tap the first one's center)
#   message-flat-list        -> the channel screen has actually mounted
#   message-list-item-<uuid> -> individual message rows (counted after scroll)
#
# Usage: perf/drive-channel-scenario.sh [num_swipes]
# Run it WHILE a profile capture is active to capture open + scroll.

set -uo pipefail
SWIPES="${1:-10}"
UIXML=/tmp/scenario-ui.xml

dump() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 && adb pull /sdcard/ui.xml "$UIXML" >/dev/null 2>&1; }
has() { grep -q "$1" "$UIXML"; }

echo "waiting for channel rows to render..."
for _ in $(seq 1 30); do dump; has 'resource-id="channel-preview-button"' && break; sleep 1; done
has 'resource-id="channel-preview-button"' || { echo "ERR: channel rows never appeared"; exit 1; }

BOX=$(grep -oE 'resource-id="channel-preview-button"[^>]*bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' "$UIXML" \
  | grep -oE '\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]' | head -1)
[ -z "$BOX" ] && { echo "ERR: no channel-preview-button found"; exit 1; }
CX=$(echo "$BOX" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/(\1+\3)\/2/' | bc)
CY=$(echo "$BOX" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/(\2+\4)\/2/' | bc)
echo "tapping channel at $CX,$CY"
adb shell input tap "$CX" "$CY"

echo "waiting for channel to mount (message-flat-list)..."
MOUNTED=0
for i in $(seq 1 25); do
  sleep 1; dump
  if has 'resource-id="message-flat-list"'; then echo "MOUNTED after ~${i}s"; MOUNTED=1; break; fi
done
[ "$MOUNTED" = 1 ] || { echo "ERR: channel never mounted"; exit 1; }

echo "scrolling ${SWIPES}x to mount older rows..."
for _ in $(seq 1 "$SWIPES"); do adb shell input swipe 540 700 540 1600 250; sleep 0.6; done

dump
N=$(grep -coE 'resource-id="message-list-item-' "$UIXML")
echo "DONE — message-list-items currently in tree: $N"
