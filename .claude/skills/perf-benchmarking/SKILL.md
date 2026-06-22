---
name: perf-benchmarking
description: Measure React Native performance on-device for stream-chat-react-native — Hermes CPU profiles, deterministic call/listener counting, component render profiling, and memory/jank capture. Use when asked to benchmark a change, prove or disprove a perf claim, compare before/after, find what re-renders or what's heavy on the JS thread, or "do some perf testing". Drives the SampleApp on a connected Android device via the perf/ toolkit. Read this BEFORE measuring — it encodes which instrument to pick and the methodology mistakes never to repeat.
---

# Perf benchmarking (on-device, stream-chat-react-native)

How to measure SDK performance for real, against the **SampleApp running on a physical Android device**, using the committed `perf/` toolkit. This skill exists because the methodology is full of traps that produce confidently-wrong numbers; follow the rules and recipes here instead of improvising.

Prerequisites for almost everything below:
- Metro running: `yarn workspace sampleapp start` (the device pulls the JS bundle from it; **Metro bundles the SDK from `src`** via the `react-native` package.json field, so editing `package/src/**` hot-reloads on relaunch — no `yarn build` needed).
- A device/emulator connected: `adb devices` shows one. The SampleApp package is `io.getstream.reactnative.sampleapp`.

## What we're measuring for

The question is always: **is this change a net positive for performance, and by how much?** There are two axes, and **either one improving (without regressing the other) is a win worth shipping**:

- **Lighter** — less work per message / per action: fewer native calls, fewer listeners, fewer renders, less JS-thread time. A genuine win **even if render latency is unchanged**.
- **Faster** — the render / draw itself takes less time.

Good-practice bar for this SDK: **if messages (or the action under test) end up lighter and/or render faster, that's a win.** Always quantify the delta (counts and/or ms) and state the direction — net positive / neutral / regression. Report both axes honestly: don't dress a lightness win up as "faster" (rule 4), but don't *undersell* a lightness win either — it counts.

## Non-negotiable rules

1. **Measure on a real device, never Node/Jest.** The RN jest preset mocks `AccessibilityInfo` and native modules, so a micro-benchmark of any native-touching code is meaningless. Proven the hard way: a Node bench said ~6µs/call; the device said ~86µs — **14× off** — purely because Jest mocked the native call to ~free.
2. **Prefer deterministic counts over timing.** Counting native calls / listeners / renders is reproducible and trustworthy. Wall-clock timing is noisy; a *single* timing sample proves nothing. If you report timing, take ≥5 runs, give median + spread, and label it debug-build.
3. **Count version-agnostically — instrument the native API, not one call site.** Wrap e.g. `AccessibilityInfo.isScreenReaderEnabled` once at app startup and count *every* caller. Instrumenting a single hook undercounts and hides that a **dependency** may dominate. Real example: after centralizing our hook, the SDK made 1 call — but the app still made ~30, because RNGH `Pressable` independently queries it per instance.
4. **Report "lighter" and "faster" as distinct wins — don't conflate them.** Removing work from a `useEffect` (off the render/draw path) is a real win even though it doesn't lower draw latency. Both axes count (see "What we're measuring for"); just never claim "renders faster" from effect-phase work — name the axis that improved and quantify it.
5. **Match the instrument to the change size.**
   - Structural per-call / per-render change → **counting** (Pattern 1).
   - Big JS-thread cost change → **Hermes CPU profile** (Pattern 2).
   - "What component re-renders too much / too often" → **React DevTools profile** (`analyze-react-profile.js`).
   - Memory / jank / dropped frames → **`android-heap-dump.sh`**.
   - A CPU-profile **`--diff` is blind to sub-noise changes** and is polluted by line-number-shift phantom deltas when you diff across a code edit. Do not use it to "prove" a tiny change.
6. **A/B fairly.** Same scenario, same instrumentation, same device, same channel (with enough messages), same swipe count. Only the code under test differs.
7. **Drive the device on real mount signals, not `sleep`.** Android *debug* navigation is slow and variable. Wait on testIDs (`channel-preview-button` → `message-flat-list`), never a fixed sleep after a tap — or your swipes land on the list / a half-mounted screen.
8. **Respect git-hands-off.** To A/B a committed change, produce the baseline by editing the file back locally (or `git stash` if it's uncommitted), measure, then restore by re-writing the committed version. **Never** `git commit`, `git revert`, or rewrite history to benchmark.

## The toolbox (`perf/`)

| Script | Use it for | Key usage |
|---|---|---|
| `capture-hermes-profile.js [out]` | One Hermes CPU profile (JS-thread self/total time). | `node perf/capture-hermes-profile.js perf/profiles/x.cpuprofile` — interactive (waits for Enter). Uses `ws` + `Origin` header (RN 0.85 Fusebox). |
| `capture-server.js [label]` | Long captures (minutes); auto-desymbolicates + analyzes. | `node perf/capture-server.js mylabel`; env `PERF_MAP`, `PERF_INSIDE`, `PERF_SKIP_DESYM`. |
| `analyze-cpuprofile.js` | Categorize a profile / diff two. | `node perf/analyze-cpuprofile.js x.cpuprofile [--inside Foo,Bar]` or `--diff before after [--grep re]`. |
| `analyze-react-profile.js` | **Component** render self/actual time, render counts, slowest commits, buckets (Markdown/Reanimated/RNGH/FlatList/Image). | `node perf/analyze-react-profile.js export.json` (a React DevTools Profiler export, not a `.cpuprofile`). |
| `desymbolicate-cpuprofile.js` | Per-package attribution (dev bundles collapse to one URL). | `node perf/desymbolicate-cpuprofile.js x.cpuprofile bundle.map`. |
| `android-heap-dump.sh` | Memory / codec / frame-time. | `perf/android-heap-dump.sh <label> [pkg]` → `perf/profiles/android-heap-<label>-<ts>.txt`. |
| `drive-channel-scenario.sh [swipes]` | Open a channel + scroll, waiting on testIDs. Run **while** a capture is active. | `bash perf/drive-channel-scenario.sh 6`. |

`perf/profiles/` is gitignored. See `perf/README.md` for the canonical capture/analyze docs.

## Execution patterns

### 1) Deterministic call/listener counting — the reliable default

Best for "did this change make the app do less work?" Counts are exact and reproducible; no timing noise.

**a. Version-agnostic instrument** — a throwaway file in the SampleApp, e.g. `examples/SampleApp/srPatch.ts`, wrapping the native API at startup:

```ts
import { AccessibilityInfo } from 'react-native';
const g = global as any;
g.__SR_CALLS__ = 0; g.__SR_LISTENERS__ = 0; g.__SR_US__ = 0;
const now = g.performance?.now ? () => g.performance.now() : () => Date.now();
const origIsSR = AccessibilityInfo.isScreenReaderEnabled;
let stacks = 0;
AccessibilityInfo.isScreenReaderEnabled = function () {
  g.__SR_CALLS__ += 1;
  if (stacks < 4) { stacks += 1; console.log(`[SR_STACK] #${g.__SR_CALLS__}\n${new Error().stack}`); } // who calls it
  const t0 = now(); const r = origIsSR.call(AccessibilityInfo); g.__SR_US__ += (now() - t0) * 1000; return r;
};
const origAdd = AccessibilityInfo.addEventListener;
AccessibilityInfo.addEventListener = function (name: any, h: any) {
  if (name === 'screenReaderChanged') g.__SR_LISTENERS__ += 1;
  return origAdd.call(AccessibilityInfo, name, h);
};
```

Import it **first** in `examples/SampleApp/index.js` (`import './srPatch';` at the top) so the patch is in place before any provider mounts.

**b. Read the counters** from a `React.Profiler` in the screen under test (Profiler `onRender` fires reliably; `setInterval` logging has proven flaky). Wrap the message list in `ChannelScreen.tsx`:

```tsx
const MsgProfiler = ({ children }) => {
  const onRender = (_id, phase, dur) =>
    console.log(`[SR_M] ${phase} render=${dur.toFixed(0)}ms calls=${(global as any).__SR_CALLS__||0} listeners=${(global as any).__SR_LISTENERS__||0} us=${((global as any).__SR_US__||0).toFixed(0)}`);
  return <React.Profiler id='m' onRender={onRender}>{children}</React.Profiler>;
};
```

**c. Run + read:** relaunch, drive the scenario (Pattern 3), then `adb logcat -d -s "ReactNativeJS:V" | grep -E "SR_M|SR_STACK"`. Take the **max** `calls`/`listeners` seen (they accumulate as rows mount). The `[SR_STACK]` traces tell you *who* makes the calls — read them: a React effect frame (`commitHookPassiveMountEffects`) is one of ours; an `asyncGeneratorStep`/`tryCallTwo` chain with no React frames is a dependency.

**d. A/B:** measure with the change, then revert it (Pattern 4) and measure again, identical scenario. Report the delta in counts.

### 2) Hermes CPU profile + diff (non-interactive)

For real JS-thread cost. The capture script waits for Enter, so drive it from the background with a timed auto-stop while you run the scenario in the foreground:

```bash
# background: starts profiling, auto-stops after 50s, saves + analyzes
( sleep 50; printf '\n' ) | node perf/capture-hermes-profile.js perf/profiles/after.cpuprofile   # run_in_background
# foreground (inside the window): let it connect (~5s), then drive
sleep 5 && bash perf/drive-channel-scenario.sh 8
```

Then desymbolicate + diff:
```bash
curl -s 'http://localhost:8081/index.map?platform=android&dev=true&minify=false' -o /tmp/dev.map.json
node perf/desymbolicate-cpuprofile.js perf/profiles/after.cpuprofile /tmp/dev.map.json
node perf/analyze-cpuprofile.js --diff perf/profiles/baseline.cpuprofile perf/profiles/after.cpuprofile --grep '<fn>'
```

Heed rule 5: if the change is sub-noise, the diff will show **nothing real** (only line-shift phantom deltas) — that's expected, not a failure; fall back to Pattern 1.

### 3) Driving the device — scenarios on `scenario-lib.sh`

Scenarios are **thin scripts on top of `perf/scenario-lib.sh`**, which provides device-driving verbs so each scenario stays declarative and waits on real mount signals (never `sleep`). Verbs:
`relaunch` · `wait_for <testid> [secs]` · `tap_testid <id>` · `tap_until <tap_id> <expect_id> [tries]` (tap + retry until the next screen's testID appears — taps occasionally don't register) · `swipe_up/down/left/right [ms]` · `scroll [n] [ms]` · `count_testid <prefix>` (uses `grep -o | wc -l`, never `grep -c`).

The channel scenario (`perf/drive-channel-scenario.sh`) is the reference shape:
```bash
source "$(dirname "$0")/scenario-lib.sh"
wait_for channel-preview-button 30 || exit 1
tap_until channel-preview-button message-flat-list || exit 1   # navigate (retries the tap)
echo "MOUNTED"; scroll "${1:-10}"
echo "rows=$(count_testid message-list-item-)"
```

**Adding a new scenario (gallery, threads, reactions, …):** copy `perf/scenario-template.sh` → `perf/drive-<name>-scenario.sh`, discover the start/target testIDs by dumping the tree (`adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml /tmp/ui.xml; grep -oE 'resource-id="[^"]+"' /tmp/ui.xml | sort -u`), then express the flow with the verbs. Always use `tap_until <x> <next-screen-testid>` for navigation and `wait_for` before interacting. Known testIDs so far: `channel-list-view`, `channel-preview-button`, `message-flat-list`, `message-list-item-<uuid>`. Pick a channel/state with **enough content** (a list preview like "Heya!" is just the last message — the channel still has full history).

### 4) A/B around a committed change (git-hands-off-safe)

1. Confirm the change's state: `git status`. If committed, the feature files won't show as modified.
2. Make the **baseline**: edit the changed file(s) back to the pre-change version (re-`Write` them). Metro hot-reloads `src` on relaunch.
3. Relaunch + measure (baseline).
4. **Restore** by re-writing the committed version verbatim (read it back from git/HEAD content). Do **not** `git checkout`/`revert` over the developer's work; just rewrite the file content.
5. Measure the changed version; report the delta.

## Anti-patterns to avoid (each = a real mistake made; do the fix)

- **Node/Jest microbench of native-touching code** → mocked to ~free, ~14× wrong. → Measure on device.
- **Instrumenting one call site** → undercount; misses dependency callers. → Wrap the native API (Pattern 1a).
- **CPU-profile `--diff` for a tiny / cross-edit change** → phantom line-shift deltas dominate, real signal is sub-noise. → Use counting (Pattern 1).
- **`grep -c` on `uiautomator` XML** → the dump is one line, so it returns 1 regardless. → `grep -oE '…' | wc -l`.
- **`uiautomator dump` mid-scroll-animation** → returns a partial/sparse tree (looked like "1 row" when there were 15). → Dump after the list settles.
- **Fixed `sleep` after a tap, then swipe** → debug nav is slow; swipes hit the list / half-mounted screen. → Wait on `message-flat-list` (Pattern 3).
- **Reading cold first-mount numbers** → dominated by startup/JIT/module-init (~2500ms "mount" is mostly not your code). → Use warm re-opens; never quote the cold mount as the row cost.
- **Claiming "faster"/"slower" from one render sample** → it's within noise. → Lead with the deterministic count; only call timing differences real with N runs + non-overlapping spreads.

## Environment gotchas

- **RN 0.85 Fusebox inspector returns 401** on the WebSocket upgrade unless the `Origin` header matches the Metro host, and Node's built-in `undici` WebSocket fails the handshake (close 1006 + TypeError). `capture-hermes-profile.js` already handles both: it resolves the `ws` package (e.g. `package/node_modules/ws`) and passes `{ headers: { Origin: 'http://localhost:8081' } }`. If you write a new capture client, do the same.
- Dev-mode profiles keep function names but collapse every frame to one bundle URL — **desymbolicate** for per-package attribution.
- Always **tear down** throwaway instrumentation afterward (`srPatch.ts`, the Profiler wrap, the `index.js` import) and restore any files you edited for the baseline.

## Worked example (the case this skill came from)

Change: centralize `useScreenReaderEnabled` from a per-row hook (each `Message` row queried `AccessibilityInfo.isScreenReaderEnabled()` + added a listener on mount, ×2/row) into a single `ScreenReaderProvider` (one query + one listener app-wide; consumers read via context).

Measured version-agnostically over open+scroll on the same channel:
- **Without** the change: **83 calls / 84 listeners / 22.1 ms** synchronous JS-thread time.
- **With** the change: **30 calls / 31 listeners / 12.4 ms**.
- Removed ~53 calls, ~53 listeners, ~9.7 ms. Render time: **unchanged** (within noise) → the honest framing is **lighter, not faster**.

The `[SR_STACK]` traces revealed the residual ~30 wasn't ours: 1 call = our provider's effect; the other ~29 = **`react-native-gesture-handler`'s `Pressable`**, whose `useIsScreenReaderEnabled` does the exact per-instance query+listener — one layer down, not fixable from our SDK. Lesson: rule 3 (count every caller) is what exposed this; hook-only counting had wrongly said "1". Full record: memory `screen_reader_hook_native_query_cost.md`.

## Execution checklist

- [ ] Metro running, exactly one device connected (`adb devices`).
- [ ] Picked the right **instrument** for the change (rule 5).
- [ ] Chose a channel with enough messages; drove it on testIDs, not sleeps.
- [ ] Instrumented the **native API** (counts every caller), not a single call site.
- [ ] Captured `[SR_STACK]`/equivalent to attribute the calls (ours vs dependency).
- [ ] A/B used identical scenario + instrumentation; only code-under-test differed.
- [ ] Reported **counts** primarily; any timing has N runs + spread + "debug build".
- [ ] Stated **lighter vs faster** honestly; no "faster" claim from effect-phase work.
- [ ] Tore down all throwaway instrumentation; restored any baseline-edited files.
- [ ] Left git to the developer (no commits/reverts).

## Reference files

- `perf/README.md` — canonical capture/analyze/desymbolicate/heap docs.
- `perf/capture-hermes-profile.js`, `perf/capture-server.js` — Hermes CPU capture (the `ws`+`Origin` clients).
- `perf/analyze-cpuprofile.js` (`--inside`/`--diff`/`--grep`), `perf/analyze-react-profile.js`, `perf/desymbolicate-cpuprofile.js`.
- `perf/scenario-lib.sh` — device-driving verbs (source it). `perf/scenario-template.sh` — stub for a new scenario. `perf/drive-channel-scenario.sh` — reference scenario. `perf/android-heap-dump.sh` — memory/jank.
- `.claude/skills/accessibility/SKILL.md` — the project-skill format this mirrors.

## iOS footnote (not yet validated)

Everything here was validated on **Android**. The Hermes capture/analyze scripts are platform-agnostic — the Metro inspector connection is identical, so `capture-hermes-profile.js`, `analyze-cpuprofile.js`, etc. should work as-is on an iOS simulator. Only the **device-driving** (Pattern 3, `drive-channel-scenario.sh`) is Android-specific: for iOS, replace `adb`/`uiautomator` with `xcrun simctl` + the accessibility (AX) hierarchy or `idb ui` to find/tap testIDs, and screen-reader state maps to VoiceOver (`getCurrentVoiceOverState`). Treat an iOS run as unproven until done once and folded back in here.
