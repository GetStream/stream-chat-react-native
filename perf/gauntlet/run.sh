#!/bin/bash
# run.sh <name> "<phases>" <base-apk> <head-apk> <user>... — runs one session per user, sides in ABBA order
# (base, head, head, base, base, head, ...) so slow drift of the emulator cancels out. Output:
# out/<name>/<NN>-<role>-<user>/ per session, progress in out/<name>/progress.log.
# A user should be used once per full session (sessions mutate its channels). For extra-sample runs
# (phases "setup warm rowcost") pass each user twice so it runs on both sides: u1 u1 u2 u2.
# The session script is frozen into out/<name>/frozen/ first: never edit a script bash is executing.
set -u
G=$(cd "$(dirname "$0")" && pwd)
NAME=$1; PH=$2; BASE=$3; HEAD=$4; shift 4
RUN="$G/out/$NAME"; mkdir -p "$RUN/frozen"
cp "$G/session.sh" "$RUN/frozen/session.sh"
echo "[$(date '+%F %T')] start: phases='$PH' base=$BASE head=$HEAD users=$* RUNS=${RUNS:-5}" >> "$RUN/progress.log"
n=0
for user in "$@"; do
  case $((n % 4)) in 0|3) role=base; apk=$BASE ;; *) role=head; apk=$HEAD ;; esac
  n=$((n + 1)); out=$(printf '%s/%02d-%s-%s' "$RUN" "$n" "$role" "$user")
  if ! pf=$(bash "$G/preflight.sh" 2>&1); then
    echo "[$(date '+%F %T')] STOPPED before $(basename "$out"): $pf" >> "$RUN/progress.log"; exit 1
  fi
  echo "[$(date '+%F %T')] start $out ($pf)" >> "$RUN/progress.log"
  GAUNTLET_DIR=$G bash "$RUN/frozen/session.sh" "$role" "$apk" "$user" "$out" $PH > "$out.out" 2>&1
  echo "[$(date '+%F %T')] end $(basename "$out") exit $? warns=$(grep -c WARN "$out/session.log" 2>/dev/null)" >> "$RUN/progress.log"
done
echo "[$(date '+%F %T')] done" >> "$RUN/progress.log"
