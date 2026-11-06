---
name: perf-gauntlet
description: Full on-device performance gauntlet for stream-chat-react-native - a multi-hour, base-vs-head comparison of every major SDK flow (channel list, channel open with 100 messages, live events, composer, scroll, threads, context menu, cold start) on FlatList AND FlashList, in RELEASE builds with React's profiling renderer, with per-component render/re-render numbers, CPU per thread, frames, and statistics that survive emulator noise. Use when asked for "a full gauntlet", "perf smoke tests", "does this regress performance", "compare develop and this branch", "performance before release", or "run the perf thing again". Not for quick single-change checks (use perf-benchmarking for those).
---

# Perf gauntlet (base vs head, release builds, every major flow)

This is the procedure behind the October 2026 develop-vs-V10 comparison. It produces a table of "JS work" per
scenario for two builds (base = usually `origin/develop`, head = usually the working tree), with mount and
re-render numbers per major component, FlatList vs FlashList, CPU per thread, frame stats, and confidence
intervals. The harness lives in `perf/gauntlet/` (see its README for the file map). Read this whole file before
starting: almost every rule below exists because breaking it produced confidently wrong numbers once.

## 0. Before touching anything: tell the user what this costs, and ask two things

Say this up front (adjust numbers if the plan differs):

| Step | Time |
|---|---|
| Export base tree + install deps | 2-5 min |
| First release build of the native project | 10-15 min (later builds: 1-2 min each, JS only) |
| Seed one fresh user per session (~700 API calls each) | ~5 min per user, 4-8 users |
| Dry runs (1 run per scenario, both sides) | ~30 min |
| Main gauntlet: 4 sessions, ABBA, 5 runs per scenario | ~3.5 h (~50 min per session) |
| Extra samples for small row/scroll deltas (12 short sessions) | ~1.6 h |
| Diagnostic builds + root-causing | 0.5-2 h |
| **Total** | **~5-7 h**, the emulator is busy the whole time |

Ask (or default and say so):
1. **What is base and what is head?** Default: base = `origin/develop`, head = the current working tree.
2. **Which device?** Default: the Pixel 7 AVD (1080x2400; the driver's taps assume this size).

Nothing in the repo is edited: every source change the measurement needs is applied at bundle time by the Metro
config/transformer, and all output goes to `perf/gauntlet/out/` (gitignored). Never commit, never stash, never
check out other refs in the user's tree (base is exported with `git archive`).

## 1. The non-negotiable rules (each one cost hours once)

1. **Release builds with React's profiling renderer, never debug.** Debug React is 3-4x slower and does dev-only
   work that differs between versions; an attached CDP profiler doubles dev work again. The Metro config swaps
   `ReactFabric-prod` for `ReactFabric-profiling`, which keeps `fiber.actualDuration` and Profiler commit hooks
   in an otherwise normal release bundle.
2. **The emulator's speed depends on the HOST, and it can silently drop 5-7x for React work.** Confirmed
   mechanism: host memory pressure (gradle builds, yarn install, Metro/hermesc, a big IDE) makes macOS compress the
   emulator's RAM (3.3 GB compressed right after two builds); memory-heavy work (React rendering, Fabric) then runs
   5-7x slower until the emulator is cold-booted, while tight CPU loops look almost normal. It can also flip
   mid-session. Therefore:
   - do ALL builds first, `./gradlew --stop`, then COLD-BOOT the emulator, then measure; never build during a run;
   - start the emulator from the user's Terminal panel (`run_in_terminal`), never from a background Bash task
     (that gives it nice 5); `ps -o nice -p $(pgrep -f qemu-system | head -1)` must be 0;
   - `preflight.sh` (run by `run.sh` before every session) waits for host load < 6 and refuses to measure when the
     host has < 20% free memory, > 512 MB of the emulator is compressed, or an on-device CPU loop is > 1.4x its
     calibration. When it stops a run: free memory, cold-boot the emulator, resume with the remaining users;
   - inside the data, the per-window speed indices (`arith`, `mem` in `report.py main`) FLAG a mode change (they
     rise ~60-70% when React work is 7x slower) but do not scale with it: never "normalize" across modes. If a
     scenario's windows split into two clusters (e.g. cold start 230 ms vs 1550 ms with the same mounts), compare
     only within one mode, and say so.
3. **One native binary for both sides.** Build both APKs from THIS checkout's Android project; only the JS bundle
   differs (`build.sh` points the RN gradle plugin at each side's SampleApp). `check-native-parity.cjs` must pass;
   if native modules differ, each side needs its own native build and you must say the comparison includes native
   changes.
4. **A fresh, identically seeded user per session; ABBA side order; nothing else running.** Sessions mutate the
   user's channels (new messages, reorders, unread counts), so a reused user is a different dataset. `run.sh`
   alternates base/head as ABBA so slow drift cancels. Never seed, build or run Metro/gradle while a session runs.
5. **Nothing that touches the UI hierarchy inside a measurement window.** `uiautomator dump` is slow and can hang
   for minutes; all dumps happen before a window opens. Waits inside windows are fixed `settle` sleeps.
6. **Never edit a script bash is executing.** Bash reads scripts incrementally; an edit mid-run corrupts the run.
   `run.sh` freezes `session.sh` into `out/<name>/frozen/` first. To change scripts mid-gauntlet, write a new
   file and `mv` it over (the running bash keeps the old inode).
7. **Grant notifications after `pm clear`** (`session.sh` does). The Android 13+ permission dialog pauses the
   activity AND the JS timers; a cold start behind it measures a paused app.
8. **Cold start is `am force-stop; am start` back to back, with the window opened BEFORE the stop.** A plain
   force-stop + wait lets Firebase's datatransport job restart the process ~0.4 s later, so the launch lands in a
   half-initialized background process and cold starts become bimodal (1x vs 7x CPU).
9. **Counts first, time second.** Render counts, mounts, hook counts and context changes are deterministic and
   immune to emulator speed. Time on an emulator varies +/-10-15% between sessions; that is bigger than most real
   effects. A timing claim of a few percent needs: (a) the session-level CI (`report.py ci`), (b) the result
   normalized by the speed index, (c) JS-thread CPU agreeing. If they disagree, say the effect is below what the
   emulator can resolve.
10. **Before naming a cause, check the code is actually different.** If the "slower" components are unchanged
    code with identical hook counts, the difference is the runtime, not the code. Use diagnostic builds (section
    6) to prove a cause; never report a correlation as a cause.
11. **FlatList windowing pollutes event windows.** About 3 in 10 FlatList event windows coincide with VirtualizedList
    mounting a batch of ~30 cells (~1 s). `report.py` splits those out as `<scenario>~batch`; report them
    separately, never in the event's median.
12. **Don't flip-flop in front of the user.** Report interim numbers as interim ("not significant yet"), and only
    give a verdict once the counts, CPU and the session-level CI agree. Say how big an effect the data can and
    cannot rule out.

## 2. How the harness measures (so you can interpret and extend it)

`perf/gauntlet/runtime/probe.js` loads before anything else in the bundle (the Metro config replaces index.js's
first import with `runtime/entry-shim.js`). It installs a fake `__REACT_DEVTOOLS_GLOBAL_HOOK__` before the renderer
loads, so React reports every commit:

| Metric | Source | Meaning |
|---|---|---|
| `render_ms` | HostRoot `actualDuration` | render phase incl. host-node creation |
| `wall_ms` | hook time - HostRoot `actualStartTime` | render + Fabric commit (Yoga layout on the JS thread) + layout effects |
| `layout_fx_ms` / `passive_fx_ms` | root `<Profiler onCommit/onPostCommit>` (AppRegistry patch) | effect time |
| **`js_react_ms`** | `wall + passive` | **"JS work", the headline number** |
| per component | fiber walk over reconciled subtrees | self ms, inclusive ms (outermost instance), renders (PerformedWork), mounts |
| `dispatch_ms` | `client.dispatchEvent` wrapper (`probe-llc.js`, ES import so it hits the app's stream-chat build) | LLC event handling, per event type |
| `cpu_js/main/rt/proc_ms` | `/proc/<pid>/task/*/stat` via `devmark.sh` at window edges | thread CPU (10 ms ticks), immune to preemption |
| `speed_ms`, `mem_speed_ms` | a fixed arithmetic loop and a fixed allocate-and-walk loop, timed once a second | runtime state during the window; a jump flags a mode change (rule 2); lower = faster |
| `frames` | `dumpsys gfxinfo` reset/dump per window | UI-thread frames, jank %, p50/p90/p99 (rough on emulators) |
| `gc_n` | `HermesInternal.getInstrumentedStats()` once a second | GC count (coarse) |
| counts | probe `M` lines | loaded messages per Bench channel: proves "100 loaded" on both sides |

Everything is buffered and flushed to logcat once a second (`BENCH <kind> <json>`, < 3.5k chars per line). Windows
are opened/closed by `devmark.sh` (`PERFMARK S|E <label> <device ms> <thread ticks>`); `analyze.py` matches by
device clock. Commit ids and name ids restart per app process: everything is keyed by pid.

Bundle-time changes (`gauntlet-transformer.js`, Metro config), identical on both sides:
- SampleApp channel list query `message_limit: 25` -> `100` (so an opened channel has 100 loaded messages without
  a network round trip). The query is in `ChannelListScreen` on older trees and in `src/hooks/useChatClient.ts` once
  the app owns the list's paginator; whichever file defines it is patched, and the bundle FAILS if that file lost
  the pattern: update `MESSAGE_LIMIT_FROM`.
- static tokens for the bench users replace `src/ChatUsers` (`runtime/generated/`, gitignored, 7-day validity).
- `keep_fnames`/`keep_classnames`: without it the minifier mangles component names and attribution is wrong.
- Diagnostic builds only (`GAUNTLET_DIAG=1`): hook counts per mount, context-value changes per commit, and which
  `Message` `areEqual` check failed. Diag builds have their own Metro cache key; never take timings from them.

## 3. Data and scenarios

`seed.cjs <prefix>_sN` creates, for one device user: `Bench Mount` (160 mixed messages: text of every length,
markdown, links with previews, mentions, 1-3 image galleries, voice recordings, files, quotes, reactions, 4 thread
parents incl. one with 40 replies, edits, a pin, deletions; the latest 100 are what the list loads), `Bench Live`
(same content, receives the events), 26 `Team NN` group channels and 2 DMs (some unread, some with image
avatars). Other users (`bench_ana/ben/cleo/dan`) act through `actor.cjs` (HTTP on :9356, WS-connected so the device
gets real events).

| Scenario | Window | Notes |
|---|---|---|
| `cold_start` | force-stop + launch, 15 s | app start + channel list (offline DB first, then network) |
| `list_msg_top`, `list_msg_reorder` | message into the top channel / into the channel at the bottom of the first page (10 channels) | reorder targets Team 21, 22, ... |
| `list_reaction`, `list_typing`, `list_read`, `list_presence_on/off` | channel list events | presence = `bench_dan` connects/disconnects |
| `open_channel_<impl>`, `close_channel_<impl>` | tap Bench Mount, 6 s / back, 3 s | mount of the 100-message list |
| `ch_msg_new`, `ch_reaction`, `ch_edit`, `ch_typing`, `ch_read`, `ch_thread_reply` `_<impl>` | events into the open Bench Live | list settled 8 s first |
| `composer_type_<impl>`, `ch_own_send_<impl>` | 16 chars typed / send tap | |
| `scroll_<impl>` | 6 fixed swipes up through the 100 messages | |
| `thread_open/close_<impl>`, `thread_reply_event_<impl>` | the 40-reply thread | parent found by scrolling before the window |
| `menu_open`, `menu_close` | long-press newest message / back | FlatList phase only |
| `x_open_flat`, `x_scroll_flat` | phase `rowcost`: open + scroll only | extra samples for small row-mount deltas |

`<impl>` = `flat` (FlatList) or `flash` (FlashList); the session switches through the SampleApp secret menu
(7+ taps on the drawer user name) and restarts the app.

## 4. Procedure (exact commands; `G=perf/gauntlet`)

**4.1 Environment** (do 4.2 builds FIRST if the emulator is already up, then cold-boot it before measuring)
1. One device: `adb devices`. Start the emulator via `run_in_terminal`:
   `~/Library/Android/sdk/emulator/emulator -avd Android16_Pixel7 -port 5556 -dns-server 8.8.8.8,1.1.1.1 -no-snapshot-load -no-snapshot-save -no-audio`
   Wait for `getprop sys.boot_completed` = 1; `adb shell svc wifi enable`; check rule 2 (nice 0). Record the
   original device settings (wifi, `debug_http_host`, animation scales, installed app) to restore afterwards.
2. Stop anything that loads the host: Metro servers, old harness daemons, gradle daemons (`./gradlew --stop`)
   after builds.

**4.2 Builds**
1. `bash $G/export-ref.sh origin/develop base-tree` (base; skip for the working tree).
2. `GAUNTLET_USER_PREFIX=g<yyyymmdd> node $G/tokens.cjs 12` (fresh users each gauntlet: 4 main + 4 spare + 4
   for extra runs). Tokens expire after 7 days: regenerate and REBUILD (the APK embeds them).
3. `bash $G/build.sh base $G/out/trees/base-tree` and `bash $G/build.sh head .` (from the repo root). Each verifies
   the probe is in the bundle and records the APK md5.
4. `(cd examples/SampleApp/android && ./gradlew --stop)`, then COLD-BOOT the emulator (rule 2) and run
   `bash $G/preflight.sh` until it passes. The first pass stores the device calibration for this gauntlet
   (`out/device-calibration.txt`; delete it when you switch devices).

**4.3 Seed** (sequentially, nothing measuring meanwhile): `for n in 1 2 3 4 5 6; do node $G/seed.cjs g<date>_s$n; done`
in a background task. Start the actor: `nohup node $G/actor.cjs > $G/out/actor.log 2>&1 &` and check
`curl -s 127.0.0.1:9356/x` returns `{"ok":true,"r":"unknown"}`.

**4.4 Dry runs** (mandatory; cheap compared to a wasted session): `RUNS=1 bash $G/session.sh base base <user1>
$G/out/dry-base` and the same for head (a separate spare user, or reuse user1 since dry data is thrown away).
Then `python3 $G/analyze.py <dir>` and check:
- no `WARN` in `session.log`; every expected scenario label present;
- probe `M` lines: Bench Mount = 100 on both sides (`grep "BENCH M" logcat.txt`);
- `report.py diff open_channel_flat <dirs>`: names are real component names (no `?NN`), `Message` mounts ~57
  on FlatList, FlatList scenarios contain `VirtualizedList`/`CellRenderer`, FlashList ones contain `FlashList`;
- speed index reasonable (1-3 ms) and stable.
If the base SampleApp differs (testIDs, labels, secret menu), fix the driver now.

**4.5 Main gauntlet** (background task; ~3.5 h):
`RUNS=5 bash $G/run.sh main "setup warm cold list flat flash" base head g<date>_s1 g<date>_s2 g<date>_s3 g<date>_s4`
Check progress every ~10 min (`out/main/progress.log`, `WARN` counts). After the first session, look at its
speed index (`report.py main out/main` shows it per scenario): if it jumps between ~1x and ~5x+, rule 2 is broken.

**4.6 Extra samples where the main table shows a small (< 10%) timing delta on mounts/scroll:**
`RUNS=10 bash $G/run.sh rowcost "setup warm rowcost" base head u5 u5 u6 u6 u7 u7 u8 u8 u5 u5 u6 u6`
(each user on both sides, so user state cancels; ~8 min per session).

**4.7 Analyze**
- `python3 $G/report.py main $G/out/main` (headline table), `lists` (FlatList vs FlashList), `comps` (major
  components), `ci $G/out/main $G/out/rowcost` (session-level CIs), `diff <scenario> $G/out/main` (what moved).
- For every "SLOWER" row and every surprising "faster" row, find the mechanism (section 5) before reporting it.

## 5. Root-causing a delta (in this order)

1. **Is it real?** `report.py ci`: does the CI exclude 0 on JS CPU AND on render/speed? If raw time moves but
   render/speed does not, it is runtime speed, not code.
2. **Is it more work or slower work?** `report.py diff <scenario>`: compare renders and mounts first. Different
   counts = a real behavioural difference (deterministic). Same counts, more self time = check whether the code
   of those components differs (`git diff <base> -- <file>`); identical code that got "slower" = runtime, not code.
3. **Why does a row re-render?** Build diag APKs (`build.sh base-diag <root> diag`, `build.sh head-diag . diag`),
   run `session.sh ... setup warm diagthread` (or add a phase for your scenario), then:
   - `diag.py areequal <dir> <window>`: which `areEqual` check fails. EMPTY while rows re-render => they re-render
     from a context/store they read themselves (memo bypassed), not from props.
   - `diag.py ctx <dir> <window>`: which context values changed and which keys changed.
   - `diag.py hooks <base-dir> <head-dir>`: hooks per mount per component and per message row.
   Then read the consumer chain in code (who calls `useXContext()` inside the row?).
4. **Write the cause with its evidence** (counts, the failing check, the changed context key, the code line).

Worked examples from the first gauntlet: thread close re-rendered all 97 rows past the memo because rows read
`useMessageInputContext()` (for `inputBoxRef`) and that context is rebuilt on `threadId` change; presence changes
re-rendered every channel preview containing the user (the client fans the user object into every channel's
members); "rows 5-7% slower" turned out to be runtime speed (unchanged code with identical hook counts got
slower; normalized by the speed index it was +0.9%).

## 6. Report format for the user

Lead with the verdict in one sentence, then:
1. **How it was measured** (2-4 lines: release + profiling renderer, same native binary, fresh seeded users,
   N runs x sessions, JS work definition, what "significant" means). Mention anything discarded and why.
2. **Main table** grouped by area (Channel list / Channel FlatList / Channel FlashList / Thread / Context menu /
   Cold start): base ms, head ms, delta %, marking only significant changes, "same" otherwise.
3. **Regressions, each with its mechanism and evidence** (counts, failing check, code location) and whether it
   is fixable in SCRN or needs the LLC.
4. **FlatList vs FlashList** table for head.
5. **What the data cannot resolve** (e.g. "differences below ~5% on mounts are within emulator noise").
6. **Follow-ups** with size (S/M/L) and confidence; ask which to do. Add them to the team's follow-up list if
   asked (in this repo the misc list lives in the `scrn_state_cleanup_audit` memory).
Offer to publish the report as a page. Keep raw tables in `out/`.

## 7. Troubleshooting (symptom -> cause -> fix)

| Symptom | Cause | Fix |
|---|---|---|
| Same work (same mounts) 5-7x faster/slower between runs or sessions; bimodal everything | host memory pressure compressed the emulator's RAM (builds, IDE) or emulator at nice 5 | builds first, then cold-boot the emulator from `run_in_terminal`; `preflight.sh` must pass; compare within one mode only |
| `preflight: ... compressed` / `device loop ... >1.4x` | host compressed the emulator's RAM / device CPU starved | free host memory, `./gradlew --stop`, cold-boot the emulator, resume |
| Cold starts bimodal; process exists with CPU before the window | Firebase job restarted the app after force-stop | `cold` phase (stop+start back to back) |
| JS timers stop, flush lines stop, app looks frozen after login | notification permission dialog pausing the activity | `pm grant ... POST_NOTIFICATIONS` after `pm clear` |
| No `BENCH E` lines (dispatch) | probe patched stream-chat via `require` (CJS build) while the app imports the ESM build | keep the LLC patch in `probe-llc.js` (ES `import`) |
| No `BENCH M` lines on v10 | channels live in `client.channelManager`, not `activeChannels` | probe handles both |
| Component names like `FlashList` inside FlatList windows, `?NN` names | name ids differ per process / mangled names | analyzer keys names by pid; keep `keep_fnames` |
| Counts doubled after cold starts | commit ids restart per process | analyzer keys commits by pid |
| `uiautomator dump` takes minutes | UI not idle / two dumps colliding | never run a manual dump while a session runs; `ui.py` kills a dump after 25 s |
| Script did random things mid-run | it was edited while bash executed it | frozen copies; `mv` a new file over |
| Thread step finds no parent / taps the header | label near the top or FlashList overshoot | `find.py` y-range; replay + look-down logic in `session.sh` |
| A tap opened a Google sign-in / system screen | stray taps after a failed step | back out with `keyevent 4`; never interact with account screens |
| `diag.py hooks` says no data for one side | the probe's DIAG switch did not apply | transformer matches `runtime/probe.js`; rebuild the diag APK |
| zsh word-splitting breaks loops (`set -- $spec`, `$D` lists) | the tool shell is zsh | put loops in bash scripts (`run.sh`), or `bash -c` |
| Report shows huge "typing" or "msg new" deltas on FlatList | VirtualizedList batch mounts in some windows | read the non-`~batch` rows; report batch frequency separately |

## 8. Cleanup (always, and say what you did)

Stop the actor (`pkill -f "node .*actor.cjs"`) and any `adb logcat` readers; `./gradlew --stop`; restore the
device settings you recorded (wifi, `debug_http_host`, animation scales) and tell the user which APK is now
installed (a release/diag gauntlet build replaces their debug app). Leave the emulator running in its terminal tab
unless asked. Keep `out/` (gitignored) for the report; mention its size if large (exported trees with
node_modules are ~1-2 GB).

## 9. Adapting the harness

- New SampleApp version changes the channel list query: update `MESSAGE_LIMIT_FROM` in `gauntlet-transformer.js`.
- New testIDs/labels: `session.sh` uses `channel-list-view`, `channel-preview-button` (content-desc contains the
  channel name), `message-flat-list`, `auto-complete-text-input`, `scroll-to-bottom-button`, `message-content-wrapper`,
  text `NN Replies`, header text `Thread Reply`, secret-menu entries `FlatList`/`FlashList`.
- Different screen size: the drawer/secret-menu taps (72,220 and 255,210), swipes and the composer y-limit (2100)
  assume 1080x2400.
- New scenario: add a window in `session.sh` (open the window right before the action, settle, close), give it a
  stable `<scenario>#<run>` label, keep UI dumps outside the window, then add it to `report.py` groups if needed.
- `seed.cjs`/`actor.cjs` use the stream-chat **v10** node API from this checkout (`package/node_modules`). Running
  the harness from a v9 checkout needs the v9 signatures (`partialUpdateUser`, channel `name` vs `custom.name`).
- Physical device: same flow; skip the emulator priority rule but keep everything else. Results will be tighter.
