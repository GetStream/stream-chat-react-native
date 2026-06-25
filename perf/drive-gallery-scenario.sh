#!/usr/bin/env bash
#
# Scenario: open the Channel Details -> Photos & Videos gallery and scroll through it.
#
# This is the SCALABILITY path. The media grid infinite-scrolls, and tapping a tile feeds
# EVERY loaded message into the fullscreen viewer (formatMessage over all of them, then a
# non-windowed pager that mounts one AnimatedGallery* per asset). Preload the grid first
# to grow N, so the open + scroll exercise the O(N) cost.
#
# Run this WHILE a perf capture is active (see perf/README.md, perf/capture-*.js), or on
# its own to sanity-check the flow.
#
# Usage: perf/drive-gallery-scenario.sh [channel_name] [grid_preload_swipes] [gallery_swipes]
#   channel_name         substring of the target channel's display name (default: first channel)
#   grid_preload_swipes  times to scroll the media grid before opening (default 6) -> grows N
#   gallery_swipes       pages to swipe through inside the gallery (default 10)
#
# The channel is NOT hardcoded: pass the display name to benchmark as $1. The agent driving
# this should ASK the user which channel to benchmark; only if they don't specify one does
# it fall back to the first channel in the list. Example:
#   perf/drive-gallery-scenario.sh "<Channel Display Name>" 12 15
#
# NOTE: the gallery overlay is INVISIBLE to uiautomator (it exposes no accessibility nodes
# when TalkBack is off), so gallery-open is detected via a logcat marker emitted by the
# throwaway instrumentation in image-gallery-state-store.ts. Without that instrumentation,
# wait_for_log will time out and the run falls back to a short settle.

set -uo pipefail
source "$(dirname "$0")/scenario-lib.sh"

CHANNEL="${1:-}"
PRELOAD="${2:-6}"
GAL_SWIPES="${3:-10}"

relaunch
wait_for channel-preview-button 30 || exit 1

# 1) Open the target channel (by display name if given, else the first one).
if [ -n "$CHANNEL" ]; then
  tap_text_until "$CHANNEL" message-flat-list || exit 1
else
  tap_until channel-preview-button message-flat-list || exit 1
fi
echo "CHANNEL OPEN"

# 2) Channel header avatar -> Channel Details. RN composes the avatar Pressable into one
#    Button node and drops its testID, so target the right-most header action by position.
tap_header_until channel-details-photos-and-videos || exit 1
echo "DETAILS OPEN"

# 3) Channel Details -> Photos & Videos grid.
tap_until channel-details-photos-and-videos media-list || exit 1
wait_for media-list 15 || exit 1
echo "MEDIA LIST OPEN"

# 4) Preload: scroll DOWN through the grid to load more pages (grows the loaded-media set
#    N). The media grid is a NORMAL list (newest first), so pagination = scrolling down to
#    hit onEndReached — the OPPOSITE direction from the inverted message list. Using the
#    wrong direction here silently loads nothing beyond the first page.
scroll_down "$PRELOAD"
echo "PRELOADED ($PRELOAD down-swipes); tiles on screen=$(count_testid media-item-)"

# 5) Open the gallery on a fully-visible tile, then wait on the logcat open-marker.
adb logcat -c
tap_visible_testid media-item- 200 270 2300 || exit 1
if wait_for_log "[PERF_GAL] OPEN" 15; then
  echo "GALLERY OPEN"
else
  echo "WARN: open-marker not seen; settling 3s and continuing" >&2
  sleep 3
fi

# 6) Scroll through the gallery (page forward).
#
# IMPORTANT: the gallery pager is VELOCITY-gated, not distance-gated
# (useImageGalleryGestures.tsx onEnd: finalXPosition = translationX - velocityX*0.3 must
# exceed half-screen). `adb input swipe` releases at ~0 velocity, so these swipes SNAP
# BACK and do NOT page on a stock build — real fingers page fine. To actually drive the
# swipe phase for a perf run, temporarily OR a distance gate into that onEnd, e.g.:
#     (finalXPosition > halfScreenWidth || -event.translationX > halfScreenWidth)   // NEXT
#     (finalXPosition < -halfScreenWidth || event.translationX > halfScreenWidth)   // PREV
# then a large swipe_left/swipe_right (>half-screen travel) pages. Verify by reading the
# footer "X of Y" counter (disable LogBox so it isn't covered); compare the INDEX, not the
# slide image — adjacent slides often look identical.
for _ in $(seq 1 "$GAL_SWIPES"); do
  swipe_left 250
  sleep 0.6
done
echo "DONE"
