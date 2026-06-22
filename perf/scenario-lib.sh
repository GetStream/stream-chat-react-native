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
#   swipe_up [ms]             scroll content up / reveal older (default 250ms)
#   swipe_down [ms]           scroll content down
#   swipe_left [ms]           page forward (e.g. image gallery)
#   swipe_right [ms]          page back
#   scroll [n] [ms]           swipe_up n times (default 8) with a settle between each
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
  adb shell am force-stop "$PKG"
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
swipe_left() { adb shell input swipe 950 1200 130 1200 "${1:-250}"; }
swipe_right() { adb shell input swipe 130 1200 950 1200 "${1:-250}"; }

scroll() {
  local n="${1:-8}" ms="${2:-250}"
  for _ in $(seq 1 "$n"); do
    swipe_up "$ms"
    sleep 0.6
  done
}

count_testid() {
  ui_dump
  grep -oE "resource-id=\"$1[^\"]*\"" "$UIXML" | wc -l | tr -d ' '
}
