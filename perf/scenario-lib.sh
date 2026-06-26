#!/usr/bin/env bash
#
# scenario-lib.sh — reusable primitives for driving the SampleApp on a connected
# Android device during a perf capture. SOURCE this from a scenario script; do
# not run it directly.
#
#   source "$(dirname "$0")/scenario-lib.sh"
#
# Design: every scenario is a short, declarative sequence of these verbs. The
# golden rule is to WAIT ON REAL VIEW-HIERARCHY testIDs, never fixed sleeps —
# Android debug navigation is slow and variable, so sleeping races the mount.
#
# Verbs:
#   relaunch                  cold-restart the app to a known state (channel list)
#   wait_for <testid> [secs]  poll uiautomator until a testID appears (default 30s)
#   tap_testid <testid>       tap the center of the first element whose resource-id
#                             starts with <testid> (prefix match, so a UUID suffix is fine)
#   tap_visible_testid <pref> [min_h] [top] [bottom]
#                             like tap_testid but skips elements clipped off-screen
#                             (needed for grid tiles: the first match is often clipped
#                             under the header)
#   tap_text <substr>         tap the center of the first node whose text= contains
#                             <substr> (e.g. open a channel by its display name)
#   tap_text_until <substr> <expect_testid> [tries]
#                             scroll the list until a node with text <substr> is visible,
#                             tap it, poll for <expect_testid>; the generic "open a
#                             specific channel by name" primitive
#   wait_for_log <pattern> [secs]
#                             poll logcat (ReactNativeJS) for <pattern> — use for states
#                             the view tree can't see (the image gallery overlay
#                             contributes NO accessibility nodes when TalkBack is off, so
#                             uiautomator cannot detect it). Clear logcat before the action.
#   tap_header_action [y_max] tap the right-most clickable node in the top header band —
#                             for header actions RN won't surface a resource-id for (e.g.
#                             the channel-screen avatar button -> Channel Details)
#   tap_header_until <expect_testid> [tries] [y_max]
#                             tap_until, but via tap_header_action instead of a testID
#   swipe_up [ms]             scroll content up / reveal older (default 250ms)
#   swipe_down [ms]           scroll content down
#   swipe_left [ms]           page forward (e.g. image gallery)
#   swipe_right [ms]          page back
#   scroll [n] [ms]           swipe_up n times (default 8) with a settle between each
#                             (for the INVERTED message list — reveals older messages)
#   scroll_down [n] [ms] [settle]
#                             swipe_down n times to paginate a NORMAL list (e.g. the
#                             Photos & Videos grid). Opposite direction from scroll();
#                             longer settle so each network page lands before the next swipe
#   count_testid <prefix>     count elements whose resource-id starts with <prefix>
#                             (uses grep -o | wc -l — NEVER grep -c: the dump is one line)
#   ui_dump                   refresh the cached view tree (most verbs call this themselves)
#
# Env: PKG overrides the app id (default: io.getstream.reactnative.sampleapp).

PKG="${PKG:-io.getstream.reactnative.sampleapp}"
UIXML="${UIXML:-/tmp/perf-scenario-ui.xml}"

ui_dump() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 &&
    adb pull /sdcard/ui.xml "$UIXML" >/dev/null 2>&1
}

relaunch() {
  # force-stop alone can resume warm on some OEM ROMs (MIUI), which would leave the JS
  # context — and any cumulative perf counters — alive. force-stop + kill + a short wait
  # guarantees a true cold JS re-init.
  adb shell am force-stop "$PKG"
  adb shell am kill "$PKG" >/dev/null 2>&1
  sleep 1
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
}

wait_for() {
  local id="$1" timeout="${2:-30}"
  for _ in $(seq 1 "$timeout"); do
    ui_dump
    if grep -q "resource-id=\"$id" "$UIXML"; then
      return 0
    fi
    sleep 1
  done
  echo "ERR: testID '$id' never appeared within ${timeout}s" >&2
  return 1
}

tap_testid() {
  local id="$1"
  ui_dump
  local box
  box=$(grep -oE "resource-id=\"$id[^\"]*\"[^>]*bounds=\"\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]\"" "$UIXML" |
    grep -oE '\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]' | head -1)
  if [ -z "$box" ]; then
    echo "ERR: no element found for testID '$id'" >&2
    return 1
  fi
  local cx cy
  cx=$(echo "$box" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/(\1+\3)\/2/' | bc)
  cy=$(echo "$box" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/(\2+\4)\/2/' | bc)
  echo "tap '$id' @ $cx,$cy"
  adb shell input tap "$cx" "$cy"
}

tap_until() {
  # tap_until <tap_testid> <expect_testid> [tries] [wait_each_s]
  # Taps <tap_testid>, then polls for <expect_testid>; retries the tap if it
  # didn't land (Android taps occasionally don't register / the list isn't
  # settled). Use this for navigation instead of a bare tap + wait_for.
  local tap_id="$1" expect_id="$2" tries="${3:-4}" each="${4:-6}"
  local i j
  for i in $(seq 1 "$tries"); do
    tap_testid "$tap_id" || return 1
    for j in $(seq 1 "$each"); do
      sleep 1
      ui_dump
      if grep -q "resource-id=\"$expect_id" "$UIXML"; then
        return 0
      fi
    done
    echo "retry $i: '$expect_id' not up after tapping '$tap_id'" >&2
  done
  echo "ERR: '$expect_id' never appeared after $tries taps of '$tap_id'" >&2
  return 1
}

swipe_up() { adb shell input swipe 540 700 540 1600 "${1:-250}"; }
swipe_down() { adb shell input swipe 540 1600 540 700 "${1:-250}"; }
# Horizontal swipes kept clear of the screen edges: a swipe that starts/ends within the
# OEM edge-gesture zone (outer ~10%) triggers the system BACK gesture instead (it will
# pop you out of the screen). 880<->200 is a ~680px central swipe, safe on a 1080px device.
swipe_left() { adb shell input swipe 880 1100 200 1100 "${1:-250}"; }
swipe_right() { adb shell input swipe 200 1100 880 1100 "${1:-250}"; }

scroll() {
  local n="${1:-8}" ms="${2:-250}"
  for _ in $(seq 1 "$n"); do
    swipe_up "$ms"
    sleep 0.6
  done
}

scroll_down() {
  # Paginate a NORMAL (non-inverted) list — e.g. the Photos & Videos media grid — by
  # scrolling down through it to reach the bottom and trigger onEndReached/loadMore.
  # This is the OPPOSITE direction from scroll() (which scrolls an inverted message list
  # up to reveal older). The settle is longer because each page is a network round-trip;
  # too short and the next swipe fires before the page lands, so N stops growing.
  local n="${1:-8}" ms="${2:-250}" settle="${3:-1.2}"
  for _ in $(seq 1 "$n"); do
    swipe_down "$ms"
    sleep "$settle"
  done
}

count_testid() {
  ui_dump
  grep -oE "resource-id=\"$1[^\"]*\"" "$UIXML" | wc -l | tr -d ' '
}

_center_of_box() {
  # echo "cx cy" for a uiautomator bounds string "[x1,y1][x2,y2]"
  echo "$1" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/(\1+\3)\/2 (\2+\4)\/2/' |
    { read -r a b; echo "$(echo "$a" | bc) $(echo "$b" | bc)"; }
}

tap_visible_testid() {
  # tap_visible_testid <prefix> [min_h] [top_guard] [bottom_guard]
  # Tap the center of the first element whose resource-id starts with <prefix> that is
  # fully on-screen (height >= min_h, top >= top_guard, bottom <= bottom_guard). Grid
  # tiles' first match is usually clipped under the header, so a plain tap_testid lands
  # on a sliver and misses.
  local prefix="$1" min_h="${2:-200}" top="${3:-260}" bottom="${4:-2300}"
  ui_dump
  local center
  center=$(grep -oE "<node[^>]*resource-id=\"$prefix[^\"]*\"[^>]*bounds=\"\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]\"" "$UIXML" |
    grep -oE '\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]' |
    awk -F'[][,]' -v mh="$min_h" -v tg="$top" -v bg="$bottom" \
      '{x1=$2;y1=$3;x2=$5;y2=$6; h=y2-y1; if (h>=mh && y1>=tg && y2<=bg){printf "%d %d\n",(x1+x2)/2,(y1+y2)/2; exit}}')
  if [ -z "$center" ]; then
    echo "ERR: no fully-visible element for testID '$prefix'" >&2
    return 1
  fi
  echo "tap visible '$prefix' @ $center"
  # shellcheck disable=SC2086
  adb shell input tap $center
}

tap_text() {
  # tap_text <substring> : tap the center of the first node whose text= contains
  # <substring>. The tap lands on the pressable behind the text (e.g. a channel row).
  # Keep <substring> free of regex metacharacters.
  local needle="$1"
  ui_dump
  local box
  box=$(grep -oE "<node[^>]*text=\"[^\"]*${needle}[^\"]*\"[^>]*bounds=\"\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]\"" "$UIXML" |
    grep -oE '\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]' | head -1)
  if [ -z "$box" ]; then
    echo "ERR: no node with text matching '$needle'" >&2
    return 1
  fi
  local center
  center=$(_center_of_box "$box")
  echo "tap text '$needle' @ $center"
  # shellcheck disable=SC2086
  adb shell input tap $center
}

tap_text_until() {
  # tap_text_until <substring> <expect_testid> [tries]
  # Scroll the list until a node with text containing <substring> is visible, tap it,
  # and poll for <expect_testid>. Retries / scrolls if not found. Opens a specific
  # channel by name without hardcoding its position in the list.
  local needle="$1" expect_id="$2" tries="${3:-8}"
  local i j
  for i in $(seq 1 "$tries"); do
    ui_dump
    if grep -qE "text=\"[^\"]*${needle}[^\"]*\"" "$UIXML"; then
      tap_text "$needle" || return 1
      for j in $(seq 1 6); do
        sleep 1
        ui_dump
        if grep -q "resource-id=\"$expect_id" "$UIXML"; then
          return 0
        fi
      done
      echo "retry $i: '$expect_id' not up after tapping text '$needle'" >&2
    else
      echo "scan $i: text '$needle' not visible, scrolling" >&2
      swipe_up 250
      sleep 0.6
    fi
  done
  echo "ERR: never reached '$expect_id' via text '$needle'" >&2
  return 1
}

wait_for_log() {
  # wait_for_log <grep_pattern> [secs]
  # Poll logcat (ReactNativeJS) for a fixed-string pattern. Use for states the view tree
  # cannot see — notably the image gallery overlay, which exposes no accessibility nodes
  # when TalkBack is off, so uiautomator dump only ever sees the screen behind it.
  # Clear logcat (adb logcat -c) before the action that should emit the marker.
  local pat="$1" timeout="${2:-15}"
  for _ in $(seq 1 "$timeout"); do
    if adb logcat -d -s ReactNativeJS:V 2>/dev/null | grep -qF "$pat"; then
      return 0
    fi
    sleep 1
  done
  echo "ERR: log pattern '$pat' never appeared within ${timeout}s" >&2
  return 1
}

tap_header_action() {
  # tap_header_action [y_max]
  # Tap the right-most clickable node within the top header band (top edge < y_max).
  # Use for a header action that RN won't surface a resource-id for — e.g. the channel
  # screen's avatar button, which RN composes with the avatar into one Button node with
  # the avatar's content-desc, dropping the testID. The back button shares the band on
  # the left, so we take the right-most clickable.
  local ymax="${1:-300}"
  ui_dump
  local center
  center=$(grep -oE '<node[^>]*clickable="true"[^>]*bounds="\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]"' "$UIXML" |
    grep -oE '\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]' |
    awk -F'[][,]' -v ym="$ymax" \
      '{x1=$2;y1=$3;x2=$5;y2=$6; if (y1<ym){cx=int((x1+x2)/2); cy=int((y1+y2)/2); if (cx>maxx){maxx=cx; bx=cx; by=cy}}} END{if (bx!=""){printf "%d %d\n",bx,by}}')
  if [ -z "$center" ]; then
    echo "ERR: no header-band clickable node found (top < ${ymax}px)" >&2
    return 1
  fi
  echo "tap header action @ $center"
  # shellcheck disable=SC2086
  adb shell input tap $center
}

tap_header_until() {
  # tap_header_until <expect_testid> [tries] [y_max]
  # Like tap_until, but taps the right-most header action (see tap_header_action) instead
  # of a testID. Polls for <expect_testid> and retries.
  local expect_id="$1" tries="${2:-4}" ymax="${3:-300}" i j
  for i in $(seq 1 "$tries"); do
    tap_header_action "$ymax" || return 1
    for j in $(seq 1 6); do
      sleep 1
      ui_dump
      if grep -q "resource-id=\"$expect_id" "$UIXML"; then
        return 0
      fi
    done
    echo "retry $i: '$expect_id' not up after header tap" >&2
  done
  echo "ERR: '$expect_id' never appeared after $tries header taps" >&2
  return 1
}
