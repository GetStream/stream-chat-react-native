#!/usr/bin/env bash
#
# Scenario: open the first channel and scroll to mount/remount message rows.
# Run this WHILE a perf capture is active (see perf/README.md, perf/capture-*.js).
#
# Usage: perf/drive-channel-scenario.sh [num_swipes]   (default 10)

set -uo pipefail
source "$(dirname "$0")/scenario-lib.sh"

SWIPES="${1:-10}"

wait_for channel-preview-button 30 || exit 1                 # channel list rendered
tap_until channel-preview-button message-flat-list || exit 1 # open first channel (retries tap until mounted)
echo "MOUNTED"

scroll "$SWIPES"
echo "DONE — message rows in tree: $(count_testid message-list-item-)"
