#!/usr/bin/env bash
#
# TEMPLATE for a new perf scenario. Copy to perf/drive-<name>-scenario.sh and
# fill in. Run it WHILE a capture is active.
#
# How to build one:
#   1. Open the SampleApp to the start state and dump the tree to find testIDs:
#        adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml /tmp/ui.xml
#        grep -oE 'resource-id="[^"]+"' /tmp/ui.xml | sort -u
#   2. Express the flow as wait_for/tap_testid/swipe_*/scroll/count_testid verbs.
#   3. Always wait_for the NEXT screen's testID after each tap — never sleep.
#
# Example — image gallery (testIDs are placeholders; discover the real ones):
#
#   set -uo pipefail
#   source "$(dirname "$0")/scenario-lib.sh"
#
#   wait_for channel-preview-button 30 || exit 1
#   tap_testid channel-preview-button || exit 1
#   wait_for message-flat-list 25 || exit 1
#   tap_testid <image-attachment-testid> || exit 1   # open an image
#   wait_for <image-gallery-testid> 15 || exit 1      # gallery mounted
#   echo "GALLERY OPEN"
#   for _ in $(seq 1 "${1:-8}"); do swipe_left; sleep 0.6; done   # page through images
#   echo "DONE"

set -uo pipefail
source "$(dirname "$0")/scenario-lib.sh"

echo "Fill me in — see the header. Available verbs: relaunch, wait_for, tap_testid,"
echo "swipe_up/down/left/right, scroll, count_testid, ui_dump."
