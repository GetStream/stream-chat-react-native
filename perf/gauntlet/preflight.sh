#!/bin/bash
# preflight.sh — run before every session (run.sh does). Waits for the HOST to calm down and refuses to
# measure on an unhealthy device. Exit 1 = do not measure (fix the cause first).
#  - host 1-min load average must drop below GAUNTLET_MAX_LOAD (default 6): builds, yarn install, Metro and
#    hermesc keep it at 15-30 for minutes after they finish; waits up to 15 min.
#  - emulator process must run at nice 0 (started from a background task it gets nice 5 -> E-cores, 7-8x noise).
#  - device speed: a fixed shell CPU loop (median of 3) must stay within 1.4x of the first measurement of this
#    gauntlet (stored in out/device-calibration.txt; a fresh Pixel 7 AVD takes ~120 ms). Catches swap thrash
#    after a day of reinstalls, host load and slow-core placement in one number. Fix: cold-boot the emulator.
#    (Swap use itself is NOT a signal: a fresh boot already swaps ~600 MB to zram.)
#  - host memory: >= 20% free and < 512 MB of the emulator's RAM compressed (see below).
S=${GAUNTLET_SERIAL:-$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')}
MAXLOAD=${GAUNTLET_MAX_LOAD:-6}
G=$(cd "$(dirname "$0")" && pwd)
[ -n "$S" ] || { echo "preflight: no adb device"; exit 1; }
for i in $(seq 1 90); do
  load=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}'); [ -n "$load" ] || load=$(awk '{print $1}' /proc/loadavg)
  awk -v l="$load" -v m="$MAXLOAD" 'BEGIN { exit !(l < m) }' && break
  [ "$i" = 1 ] && echo "preflight: host load $load >= $MAXLOAD, waiting"
  sleep 10
done
awk -v l="$load" -v m="$MAXLOAD" 'BEGIN { exit !(l < m) }' || { echo "preflight: host load still $load after 15 min"; exit 1; }
q=$(pgrep -f qemu-system | head -1)
if [ -n "$q" ]; then
  nice=$(ps -o nice= -p "$q" | tr -d ' ')
  [ "$nice" = 0 ] || { echo "preflight: emulator runs at nice $nice (start it from the user's Terminal panel)"; exit 1; }
  # App Nap: a windowed emulator whose window is hidden or occluded runs every thread at background QoS
  # (priority 4), several times slower, even at nice 0. A headless emulator (-no-window) is never napped.
  bg=$(ps -M -p "$q" | awk 'NR>1' | grep -cE ' [RSU] +4[A-Z]? ')
  all=$(ps -M -p "$q" | awk 'NR>1' | grep -cE ' [RSU] +[0-9]+[A-Z]? ')
  [ "$bg" -lt $((all / 2)) ] || { echo "preflight: $bg of $all emulator threads run at background priority (App Nap): restart it with -no-window"; exit 1; }
fi
# Host memory: compressed or swapped emulator RAM makes memory-heavy work (React) several x slower while
# CPU loops look normal. Require host free memory >= 20% and < 512 MB of the emulator compressed.
free_pct=$(memory_pressure 2>/dev/null | awk -F': ' '/free percentage/ {gsub("%","",$2); print $2}')
if [ -n "$q" ] && command -v top >/dev/null; then
  cmprs=$(top -l 1 -pid "$q" -stats cmprs 2>/dev/null | tail -1 | tr -d ' ')
  cmprs_mb=$(echo "$cmprs" | awk '/G$/ {print int($0*1024); next} /M$/ {print int($0); next} /K$/ {print 0; next} {print int($0/1048576)}')
fi
[ -z "$free_pct" ] || [ "$free_pct" -ge 20 ] || { echo "preflight: host memory free ${free_pct}% < 20% (close apps, stop gradle daemons)"; exit 1; }
[ -z "$cmprs_mb" ] || [ "$cmprs_mb" -lt 512 ] || { echo "preflight: ${cmprs_mb}MB of the emulator's RAM is compressed (host memory pressure): free memory, cold-boot the emulator"; exit 1; }
loop_ms() { adb -s "$S" shell 's=$(date +%s%N); i=0; while [ $i -lt 100000 ]; do i=$((i+1)); done; e=$(date +%s%N); echo $(( (e-s)/1000000 ))' | tr -d '\r'; }
speed=$( (loop_ms; loop_ms; loop_ms) | sort -n | sed -n 2p)
CAL="$G/out/device-calibration.txt"
mkdir -p "$G/out"; [ -s "$CAL" ] || echo "$speed" > "$CAL"
ref=$(cat "$CAL")
avail=$(adb -s "$S" shell cat /proc/meminfo | awk '/MemAvailable/ {print int($2/1024)}')
awk -v s="$speed" -v r="$ref" 'BEGIN { exit !(s <= r * 1.4) }' || {
  echo "preflight: device loop ${speed}ms vs calibration ${ref}ms (>1.4x; MemAvailable ${avail}MB): cold-boot the emulator"; exit 1; }
echo "preflight ok: host load $load, host free ${free_pct:-?}%, emulator nice ${nice:-n/a} compressed ${cmprs_mb:-?}MB, device loop ${speed}ms (cal ${ref}ms), MemAvailable ${avail}MB"
