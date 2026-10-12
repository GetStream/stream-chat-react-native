#!/bin/bash
# session.sh <base|head> <apk-label> <user> <outdir> [phases...]
# One measurement session: installs out/apk/<apk-label>.apk, logs in as <user> (seeded: out/seed/seed-<user>.json),
# runs the phases, then analyzes. Every scenario window is S/E-marked on the device clock; nothing that touches
# the UI hierarchy (uiautomator dumps) runs inside a window.
# Phases (default "setup warm cold list flat flash"): setup warm cold list flat flash rowcost diagthread.
# Env: RUNS (default 5), GAUNTLET_SERIAL (default: first adb device), GAUNTLET_PKG.
# Coordinates assume a 1080x2400 screen (the Pixel 7 AVD); setup warns otherwise.
# Never edit this file while a session runs (bash reads scripts incrementally): run.sh runs a frozen copy.
G=${GAUNTLET_DIR:-$(cd "$(dirname "$0")" && pwd)}
B=$G
ROLE=$1; LABEL_APK=$2; ME=$3; OUT=$4; shift 4
PHASES=" ${*:-setup warm cold list flat flash} "
S=${GAUNTLET_SERIAL:-$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')}
P=${GAUNTLET_PKG:-io.getstream.reactnative.sampleapp}
R=${RUNS:-5}
[ -n "$S" ] || { echo "no adb device"; exit 1; }
mkdir -p "$OUT/gfx"
SEED=$G/out/seed/seed-$ME.json
[ -f "$SEED" ] || { echo "no $SEED"; exit 1; }
j() { node -e "const s=require('$SEED'); console.log($1)"; }
MOUNT_CID=$(j s.mount.cid); LIVE_CID=$(j s.live.cid); PARENT=$(j s.mount.threadParent)
has() { [[ "$PHASES" == *" $1 "* ]]; }
A() { adb -s $S "$@"; }
U() { python3 "$B/ui.py" $S "$@"; }
log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$OUT/session.log"; }
act() { curl -s -m 30 "http://127.0.0.1:9356/$1"; }
LABEL=
win() { LABEL=$1; A shell dumpsys gfxinfo $P reset >/dev/null; A shell sh /data/local/tmp/devmark.sh S "$LABEL" $P; }
endwin() { A shell sh /data/local/tmp/devmark.sh E "$LABEL" $P; A shell dumpsys gfxinfo $P > "$OUT/gfx/$LABEL.txt"; }
settle() { sleep "${1:-2}"; }
back() { A shell input keyevent 4; }
hide_kb() { A shell dumpsys input_method | grep -q 'mInputShown=true' && back; return 0; }
findre() { python3 "$B/find.py" $S "$1"; }
deny_notif() { U has-id com.android.permissioncontroller:id/permission_deny_button && U tap-id com.android.permissioncontroller:id/permission_deny_button; }
on_list() { U has-id channel-list-view; }
to_list() { local t; for t in 1 2 3 4; do on_list && return 0; back; sleep 1.5; done; on_list; }
# tap a channel row by its name (dump happens before the caller opens a window)
row_xy() { U dump | python3 -c "
import sys,re
for l in sys.stdin:
    if \"id='channel-preview-button'\" in l and ', $1, ' in l:
        x1,y1,x2,y2=map(int,re.findall(r'\d+',l.split(')')[0])); print((x1+x2)//2,(y1+y2)//2); break"; }
open_channel_unmeasured() { local xy; xy=$(row_xy "$1"); [ -n "$xy" ] || return 1; A shell input tap $xy; U wait-id message-flat-list 20; }
scroll_up_n() { local k; for k in $(seq 1 $1); do A shell input swipe 540 800 540 1800 300; sleep 0.6; done; }
scroll_thread_n() { local k; for k in $(seq 1 $1); do A shell input swipe 540 800 540 1600 400; sleep 1.2; done; }
restart_app() { A shell am force-stop $P; A shell am start -n $P/.MainActivity >/dev/null; U wait-id channel-list-view 90 || { deny_notif; U wait-id channel-list-view 60; }; deny_notif; }
set_list_impl() { # FlatList|FlashList
  local ok= attempt
  for attempt in 1 2 3; do
    to_list; A shell input tap 72 220; sleep 3; for _t in 1 2 3 4 5 6 7 8; do A shell input tap 255 210; sleep 0.4; done; sleep 2
    if U tap-text "$1"; then ok=1; break; fi
    back; sleep 2
  done
  [ -n "$ok" ] || { log "WARN could not switch to $1"; return 1; }
  sleep 1; back; sleep 1; restart_app; sleep 8; log "list implementation: $1"; }

# logcat for the whole session
A logcat -c; A logcat -G 16M >/dev/null
adb -s $S logcat -v epoch -s ReactNativeJS:V PERFMARK:V > "$OUT/logcat.txt" &
LC=$!
trap 'kill $LC 2>/dev/null' EXIT
A push "$B/devmark.sh" /data/local/tmp/devmark.sh >/dev/null
echo "side=$ROLE apk=$LABEL_APK apk_md5=$(cat "$G/out/apk/$LABEL_APK.md5" 2>/dev/null) user=$ME seed=$(j s.ts) runs=$R phases=$PHASES" > "$OUT/meta.txt"

if has setup; then
  log "setup: install $LABEL_APK ($ROLE)"
  SIZE=$(A shell wm size | grep -oE '[0-9]+x[0-9]+' | tail -1)
  [ "$SIZE" = 1080x2400 ] || log "WARN screen is $SIZE: drawer/secret-menu taps and swipes assume 1080x2400"
  A install -r "$G/out/apk/$LABEL_APK.apk" | tail -1
  A shell pm clear $P >/dev/null
  # granted up front so the permission dialog never pauses the app (it pauses JS timers too)
  A shell pm grant $P android.permission.POST_NOTIFICATIONS
  A shell am start -n $P/.MainActivity >/dev/null
  U wait-id "user-selector-button-$ME" 40 || { for t in 1 2 3; do A shell input swipe 540 1900 540 700 400; U has-id "user-selector-button-$ME" && break; done; }
  U tap-id "user-selector-button-$ME"; sleep 4; deny_notif
  U wait-id channel-list-view 60 || { log "no channel list"; exit 1; }
  sleep 10
fi

if has warm; then
  log "warm-up (images, caches)"
  open_channel_unmeasured "Bench Mount" && { sleep 4; scroll_up_n 14; sleep 2; back; sleep 2; }
  open_channel_unmeasured "Bench Live" && { sleep 4; scroll_up_n 4; sleep 1; back; sleep 2; }
  sleep 3
fi

# Cold start, controlled: the window opens before the force-stop and the launch follows at once, so
# the process starts at launch. A plain force-stop + wait lets Firebase's datatransport job restart the app
# ~0.4s later, so the launch lands in a half-initialized background process and cold starts become bimodal.
# (The logged start reason may still say "service": that job's request lands in the same instant.)
if has cold; then
  for i in $(seq 1 $R); do
    to_list; sleep 4
    win "cold_start#$i"; A shell "am force-stop $P; am start -n $P/.MainActivity" >/dev/null; settle 15; endwin
    reason=$(A logcat -d -b events | grep "am_proc_start.*$P" | tail -1 | grep -oE "next-top-activity|service|broadcast|content provider|activity" | head -1)
    log "cold_start#$i process started for: $reason"
    on_list || U wait-id channel-list-view 30
    sleep 6
  done
fi

if has list; then
  to_list; sleep 3
  for i in $(seq 1 $R); do
    log "list events #$i"
    win "list_msg_top#$i"; act "say?cid=$LIVE_CID&user=bench_ana&text=list-top-$i" >/dev/null; settle 3; endwin; sleep 1
    # the channel at the bottom of the first page (10 channels) moves to the top: Team 21, 22, ...
    T=$((20 + i)); TCID=$(j "s.list.find(c=>c.name==='Team $T').cid")
    win "list_msg_reorder#$i"; act "say?cid=$TCID&user=bench_ben&text=list-reorder-$i" >/dev/null; settle 3; endwin; sleep 1
    MID=$(act "last?cid=$LIVE_CID&n=1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).r[0].id))")
    win "list_reaction#$i"; act "react?id=$MID&user=bench_cleo&type=like" >/dev/null; settle 3; endwin; sleep 1
    win "list_typing#$i"; act "typing?cid=$LIVE_CID&user=bench_ben&ms=1500" >/dev/null; settle 2; endwin; sleep 1
    win "list_read#$i"; act "read?cid=$LIVE_CID&user=bench_cleo" >/dev/null; settle 3; endwin; sleep 1
    win "list_presence_on#$i"; act "online?user=bench_dan" >/dev/null; settle 4; endwin; sleep 2
    win "list_presence_off#$i"; act "offline?user=bench_dan" >/dev/null; settle 4; endwin; sleep 2
  done
fi

# Channel-screen phase for one list implementation: open/close, live events, composer, scroll, thread, menu.
channel_phase() {
  local impl=$1
  to_list; sleep 2
  for i in $(seq 1 $R); do
    log "$impl open/close #$i"
    xy=$(row_xy "Bench Mount"); sleep 2
    win "open_channel_$impl#$i"; A shell input tap $xy; settle 6; endwin
    U has-id message-flat-list || { log "WARN open_channel_$impl#$i: list not visible"; to_list; continue; }
    sleep 1
    win "close_channel_$impl#$i"; back; settle 3; endwin
    on_list || { log "WARN not back on list"; to_list; }
    sleep 1
  done
  log "$impl live events"
  open_channel_unmeasured "Bench Live" || { log "cannot open Bench Live"; return 1; }
  sleep 6
  U has-id scroll-to-bottom-button && { U tap-id scroll-to-bottom-button; sleep 3; }
  sleep 8  # let the list finish its incremental cell rendering before the first event
  for i in $(seq 1 $R); do
    win "ch_msg_new_$impl#$i"; LAST=$(act "say?cid=$LIVE_CID&user=bench_ana&text=hello-$impl-$i" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).r))"); settle 3; endwin; sleep 1
    win "ch_reaction_$impl#$i"; act "react?id=$LAST&user=bench_ben&type=love" >/dev/null; settle 3; endwin; sleep 1
    win "ch_edit_$impl#$i"; act "edit?id=$LAST&user=bench_ana&text=hello-$impl-$i-edited" >/dev/null; settle 3; endwin; sleep 1
    win "ch_typing_$impl#$i"; act "typing?cid=$LIVE_CID&user=bench_cleo&ms=1500" >/dev/null; settle 2; endwin; sleep 1
    win "ch_read_$impl#$i"; act "read?cid=$LIVE_CID&user=bench_ben" >/dev/null; settle 3; endwin; sleep 1
    win "ch_thread_reply_$impl#$i"; act "reply?cid=$LIVE_CID&parent=$LAST&user=bench_cleo&text=thread-$impl-$i" >/dev/null; settle 3; endwin; sleep 1
    # composer: type 20 characters, then send
    U tap-id auto-complete-text-input; sleep 1.5
    win "composer_type_$impl#$i"; A shell input text "benchtyping$i$impl"; settle 2; endwin
    SEND=$(U dump | python3 -c "
import sys,re
for l in sys.stdin:
    if \"desc='Send'\" in l or \"id='send-button'\" in l:
        x1,y1,x2,y2=map(int,re.findall(r'\d+',l.split(')')[0])); print((x1+x2)//2,(y1+y2)//2); break")
    sleep 1
    if [ -n "$SEND" ]; then win "ch_own_send_$impl#$i"; A shell input tap $SEND; settle 3; endwin; else log "WARN no send button"; fi
    hide_kb; sleep 1.5
  done
  back; sleep 2; to_list; sleep 2
  log "$impl scroll"
  for i in $(seq 1 $R); do
    open_channel_unmeasured "Bench Mount"; sleep 4
    win "scroll_$impl#$i"; scroll_up_n 6; settle 2; endwin
    back; sleep 2; to_list; sleep 1
  done
  log "$impl thread"; TSWIPES=
  for i in $(seq 1 $R); do
    open_channel_unmeasured "Bench Mount"; sleep 4
    # the first run searches for the 40-reply parent; later runs replay the same number of swipes
    TXY=
    if [ -n "$TSWIPES" ]; then
      scroll_thread_n $TSWIPES; sleep 1.5; TXY=$(findre '4[0-9] Replies')
      # item heights are estimated (FlashList), so the replay can overshoot: look back down a little
      if [ -z "$TXY" ]; then for k in 1 2 3 4; do A shell input swipe 540 1400 540 1000 400; sleep 1.2; TXY=$(findre '4[0-9] Replies') && break; done; fi
    fi
    if [ -z "$TXY" ]; then
      for k in $(seq 1 20); do TXY=$(findre '4[0-9] Replies') && { TSWIPES=${TSWIPES:-$((k - 1))}; break; }; A shell input swipe 540 800 540 1600 400; sleep 1.2; done
    fi
    [ -n "$TXY" ] || { log "WARN thread parent not found"; back; sleep 2; continue; }
    sleep 2; TXY=$(findre '4[0-9] Replies')
    win "thread_open_$impl#$i"; A shell input tap $TXY; settle 6; endwin
    U has-text "Thread Reply" || { log "WARN thread_open_$impl#$i: thread screen not open"; to_list; continue; }
    if [ $i -le 3 ]; then
      win "thread_reply_event_$impl#$i"; act "reply?cid=$MOUNT_CID&parent=$PARENT&user=bench_ana&text=bench-reply-$impl-$i" >/dev/null; settle 3; endwin
    fi
    sleep 1
    win "thread_close_$impl#$i"; back; settle 3; endwin
    back; sleep 2; to_list; sleep 1
  done
  if [ "$impl" = flat ]; then
    log "context menu"
    to_list; open_channel_unmeasured "Bench Mount" || log "WARN menu: channel did not open"; sleep 4
    for i in $(seq 1 $R); do
      XY=$(U dump | python3 -c "
import sys,re
best=None
for l in sys.stdin:
    if \"id='message-content-wrapper'\" in l:
        x1,y1,x2,y2=map(int,re.findall(r'\d+',l.split(')')[0]))
        if y2<2100 and (best is None or y1>best[1]): best=((x1+x2)//2,(y1+y2)//2)
print(*best) if best else None")
      [ -n "$XY" ] || { log "WARN menu_open#$i: no message found"; break; }
      sleep 1.5
      win "menu_open#$i"; A shell input swipe $XY $XY 700; settle 3; endwin
      win "menu_close#$i"; back; settle 3; endwin
      U has-id message-flat-list || { log "WARN menu_close#$i: not back in the channel"; break; }
      sleep 1
    done
    back; sleep 2; to_list
  fi
}

# Extra samples of the row-mount scenarios (FlatList): opening the 100-message channel and scrolling it.
if has rowcost; then
  to_list; sleep 2
  for i in $(seq 1 $R); do
    log "rowcost #$i"
    xy=$(row_xy "Bench Mount"); sleep 2
    win "x_open_flat#$i"; A shell input tap $xy; settle 6; endwin
    U has-id message-flat-list || { log "WARN x_open_flat#$i: list not visible"; to_list; continue; }
    sleep 1
    win "x_scroll_flat#$i"; scroll_up_n 6; settle 2; endwin
    back; sleep 2; to_list; sleep 1
  done
fi

# Diagnostic: open the channel, open and close the 40-reply thread (diag builds log areEqual results).
if has diagthread; then
  to_list; sleep 2
  open_channel_unmeasured "Bench Mount"; sleep 6
  for k in $(seq 1 20); do TXY=$(findre '4[0-9] Replies') && break; A shell input swipe 540 800 540 1600 400; sleep 1.2; done
  sleep 3; TXY=$(findre '4[0-9] Replies')
  win "diag_thread_open#1"; A shell input tap $TXY; settle 6; endwin
  win "diag_thread_close#1"; back; settle 4; endwin
  win "diag_idle#1"; settle 4; endwin
fi

if has flat; then
  log "FlatList phase"
  channel_phase flat
fi
if has flash; then
  log "FlashList phase: switching"
  set_list_impl FlashList
  open_channel_unmeasured "Bench Mount" && { sleep 4; scroll_up_n 8; back; sleep 2; }
  channel_phase flash
  set_list_impl FlatList
fi
log "session done"
kill $LC 2>/dev/null
python3 "$B/analyze.py" "$OUT" > "$OUT/summary.txt" 2>&1
tail -3 "$OUT/summary.txt"
