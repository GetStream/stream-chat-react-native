# perf/

Profiling tooling for the SDK row-render perf initiative.

## Capture a `.cpuprofile`

Two options.

### A) Via the helper script

```sh
node perf/capture-hermes-profile.js
```

Connects to Metro's Hermes target, starts profiling, waits for Enter, writes a `.cpuprofile` into `perf/profiles/`, then auto-runs the analyzer.

### B) Via Chrome DevTools

1. Run SampleApp on a device. Make sure Metro is up.
2. Chromium → `chrome://inspect` → click **inspect** on the Hermes target.
3. DevTools → **Performance** tab → **Record** (Cmd+E).
4. Do your scenario (open a channel with 30+ messages; scroll to trigger renders).
5. **Stop**.
6. Right-click the recording → **Save profile…** → save into `perf/profiles/` (gitignored).

A 10–15 second profile is plenty for analysis.

## Analyze a single profile

```sh
node perf/analyze-cpuprofile.js perf/profiles/baseline.cpuprofile
```

Outputs:

- Profile summary (duration, sample count, sample rate).
- ⚠ warning if the profile looks un-desymbolicated.
- **Time by category** — auto-bucketed by source: `Idle`, `GC`, `npm: <package>`, `SDK source`, `App source`, `builtin:Object`, `builtin:JSON`, `VM / native`. No hand-curated patterns.
- Time by **source file**.
- **Top functions by self time** (where the JS thread actually sits).
- **Top functions by total time** (which call sites dominate).

Optional drilldown into specific functions:

```sh
node perf/analyze-cpuprofile.js perf/profiles/x.cpuprofile \
  --inside MessageWithContext,useCreateMessageContext,renderText
```

## Desymbolicate (per-package buckets)

Dev profiles collapse every frame into one Metro bundle URL, so categorization shows everything as `App source`. To recover per-package attribution, fetch Metro's source map and run the desymbolicator:

```sh
curl -s 'http://localhost:8081/index.map?platform=ios&dev=true&minify=false' \
  -o /tmp/dev.map.json
node perf/desymbolicate-cpuprofile.js perf/profiles/x.cpuprofile /tmp/dev.map.json
node perf/analyze-cpuprofile.js perf/profiles/x.desymbolicated.cpuprofile
```

## Diff two profiles (before vs after a change)

```sh
node perf/analyze-cpuprofile.js --diff perf/profiles/before.cpuprofile perf/profiles/after.cpuprofile
```

Per-category self-time delta + top function self-time deltas (sorted by `|delta|`). Optional `--grep <pattern>` to zoom in on specific function names. Warns if sample rates between the two profiles diverge >10%.

For a fair diff, capture both profiles using the **same scenario** and the **same device** in roughly the same conditions.

## Android heap/codec/frame capture (memory & jank diagnostics)

For perf work where the bottleneck is memory pressure, MediaCodec slot usage, or frame timing — not JS-thread CPU — use the adb-based heap dump script.

```sh
perf/android-heap-dump.sh branch
perf/android-heap-dump.sh develop      # after switching branches + rebuild
```

The script captures `dumpsys meminfo`, `gfxinfo`, `media.codec`, and `procstats` for the SampleApp and writes the combined output to `perf/profiles/android-heap-<label>-<timestamp>.txt`. Pre-test recipe (warming the video pool, resetting frame counters) is documented in the script header.

For A/B comparisons, run the same scenario on both branches and diff the `Native Heap`, `Dalvik Heap`, `TOTAL PSS`, MediaCodec instance count, and frame-time percentiles between the two output files.

## Conventions

- Keep captured `.cpuprofile` files in `perf/profiles/` (gitignored).
- Name files descriptively: `baseline.cpuprofile`, `step-8.cpuprofile`, etc.
- Profiles must be captured in dev mode (Metro) so function names are intact. Release builds are minified — desymbolicate with the matching source map if you need to analyze one.
