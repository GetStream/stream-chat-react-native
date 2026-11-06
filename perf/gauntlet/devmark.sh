#!/system/bin/sh
# devmark.sh <S|E> <label> [package] — on-device: logs a PERFMARK line with the device clock (ms) and the app's
# per-thread CPU ticks (utime+stime, 10ms) for main, JS, native-modules and RenderThread, plus the process total.
MARK_KIND=$1; MARK_LABEL=$2
P=${3:-io.getstream.reactnative.sampleapp}
pid=$(pidof $P)
out=""
if [ -n "$pid" ]; then
  set -- $(cat /proc/$pid/stat)
  out=" proc:$pid:$(( ${14} + ${15} ))"
  for t in /proc/$pid/task/*; do
    tid=${t##*/}
    c=$(cat $t/comm 2>/dev/null)
    case "$c" in
      mqt_v_js|mqt_v_native|RenderThread) ;;
      *) [ "$tid" = "$pid" ] || continue; c=main ;;
    esac
    set -- $(cat $t/stat)
    out="$out $c:$tid:$(( ${14} + ${15} ))"
  done
fi
log -t PERFMARK "$MARK_KIND $MARK_LABEL $(date +%s%3N)$out"
