#!/bin/bash
#
# android-heap-dump.sh
#
# Captures Android memory/heap/codec/frame stats for the SampleApp via adb.
#
# Usage:
#   perf/android-heap-dump.sh [label] [package]
#
#   label    — short tag included in the output filename. Default: "snapshot".
#   package  — Android package id. Default: io.getstream.reactnative.sampleapp.
#
# Examples:
#   perf/android-heap-dump.sh branch
#   perf/android-heap-dump.sh develop
#   perf/android-heap-dump.sh branch io.getstream.reactnative.sampleapp
#
# Output:
#   perf/profiles/android-heap-<label>-<timestamp>.txt
#
# Suggested workflow:
#   1. Open SampleApp on the device, sign in, open the heavy channel.
#   2. ChannelDetails → Photos & Videos → tap a mid-list slide.
#   3. Scrub ~5 slides each way to warm the video pool.
#   4. Reset frame counters mid-test:
#        adb shell dumpsys gfxinfo <package> reset
#   5. Swipe through ~10 more slides at a realistic pace.
#   6. Run this script.
#   7. Paste the output file path back to Claude.
#
# Captured sections (in order):
#   MEMINFO     — Dalvik/Native heap, total PSS, OOM grouping.
#   GFXINFO     — Frame timing percentiles + janky frames %.
#   MEDIA.CODEC — System-wide MediaCodec instances (grep your PID).
#   PROCSTATS   — Process state + memory averages over the last hour.

set -euo pipefail

LABEL="${1:-snapshot}"
PKG="${2:-io.getstream.reactnative.sampleapp}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${SCRIPT_DIR}/profiles"
mkdir -p "${OUT_DIR}"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${OUT_DIR}/android-heap-${LABEL}-${TIMESTAMP}.txt"

if ! command -v adb >/dev/null 2>&1; then
  echo "error: adb not found on PATH" >&2
  exit 1
fi

if ! adb get-state >/dev/null 2>&1; then
  echo "error: no Android device/emulator connected (adb get-state failed)" >&2
  exit 1
fi

echo "==> Package: ${PKG}"
echo "==> Output:  ${OUT}"
echo

PID="$(adb shell pidof "${PKG}" | tr -d '\r' || true)"
if [ -n "${PID}" ]; then
  echo "==> PID:     ${PID}"
else
  echo "==> PID:     (not running — capture will still proceed but some sections may be empty)"
fi
echo

{
  echo "### LABEL:     ${LABEL}"
  echo "### DATE:      $(date)"
  echo "### PACKAGE:   ${PKG}"
  echo "### PID:       ${PID:-<not running>}"
  echo "### DEVICE:    $(adb shell getprop ro.product.model | tr -d '\r') / Android $(adb shell getprop ro.build.version.release | tr -d '\r')"
  echo ""

  echo "### ============================================================"
  echo "### MEMINFO"
  echo "### ============================================================"
  adb shell dumpsys meminfo "${PKG}"
  echo ""

  echo "### ============================================================"
  echo "### GFXINFO"
  echo "### ============================================================"
  adb shell dumpsys gfxinfo "${PKG}"
  echo ""

  echo "### ============================================================"
  echo "### MEDIA.CODEC (system-wide; filter by PID ${PID:-<unknown>})"
  echo "### ============================================================"
  adb shell dumpsys media.codec
  echo ""

  echo "### ============================================================"
  echo "### PROCSTATS (last 1 hour)"
  echo "### ============================================================"
  adb shell dumpsys procstats "${PKG}" --hours 1
  echo ""
} > "${OUT}" 2>&1

LINES="$(wc -l < "${OUT}" | tr -d ' ')"
SIZE="$(wc -c < "${OUT}" | tr -d ' ')"

echo "==> Done. ${LINES} lines, ${SIZE} bytes."
echo "==> ${OUT}"
