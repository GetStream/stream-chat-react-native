#!/bin/bash
# run3.sh <name> "<phases>" <side-a> <side-b> <side-c> <user>... — run.sh for three builds. Each side is an
# APK label in out/apk/ and is recorded as the session's side. One session per user, sides in A B C C B A order
# so slow drift of the emulator cancels out; pass users in multiples of 6 for a balanced run. Report a pair with
# GAUNTLET_COMPARE=<side>:<side> python3 report.py main out/<name>.
# The session script is frozen into out/<name>/frozen/ first: never edit a script bash is executing.
set -u
G=$(cd "$(dirname "$0")" && pwd)
NAME=$1; PH=$2; SIDES=("$3" "$4" "$5"); shift 5
ORDER=(0 1 2 2 1 0)
RUN="$G/out/$NAME"; mkdir -p "$RUN/frozen"
cp "$G/session.sh" "$RUN/frozen/session.sh"
echo "[$(date '+%F %T')] start: phases='$PH' sides=${SIDES[*]} users=$* RUNS=${RUNS:-5}" >> "$RUN/progress.log"
n=0
for user in "$@"; do
  side=${SIDES[${ORDER[$((n % 6))]}]}
  n=$((n + 1)); out=$(printf '%s/%02d-%s-%s' "$RUN" "$n" "$side" "$user")
  if ! pf=$(bash "$G/preflight.sh" 2>&1); then
    echo "[$(date '+%F %T')] STOPPED before $(basename "$out"): $pf" >> "$RUN/progress.log"; exit 1
  fi
  echo "[$(date '+%F %T')] start $out ($pf)" >> "$RUN/progress.log"
  GAUNTLET_DIR=$G bash "$RUN/frozen/session.sh" "$side" "$side" "$user" "$out" $PH > "$out.out" 2>&1
  echo "[$(date '+%F %T')] end $(basename "$out") exit $? warns=$(grep -c WARN "$out/session.log" 2>/dev/null)" >> "$RUN/progress.log"
done
echo "[$(date '+%F %T')] done" >> "$RUN/progress.log"
