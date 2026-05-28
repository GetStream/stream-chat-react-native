# perf/

Profiling tooling for the SDK row-render perf initiative.

## Capture a `.cpuprofile`

1. Run SampleApp on a device (iOS or Android — Hermes either way). Make sure Metro is up.
2. Open a Chromium-based browser → `chrome://inspect` → click **inspect** on the Hermes target.
3. In DevTools: **Performance** tab → **Record** (Cmd+E).
4. Do the scenario (open a channel with 30+ messages; optionally scroll a bit to trigger more renders/recycles).
5. **Stop** recording.
6. Right-click the recording → **Save profile…** → save into `perf/profiles/` (gitignored).

A 10–15 second profile is plenty for analysis.

## Analyze a single profile

```sh
node perf/analyze-cpuprofile.js perf/profiles/baseline.cpuprofile
```

Outputs:

- Profile summary (duration, sample count, sample rate).
- Time by **category** (markdown / stringify / stream-chat-js / react internals / app code / etc.).
- Time by **source file**.
- **Top functions by self time** (where the JS thread actually sits).
- **Top functions by total time** (which call sites dominate).
- Focused breakdowns: time inside `MessageWithContext`, `useCreateMessageContext`, `renderText`, `stringifyMessage` (no-ops if a function isn't in the profile).

## Diff two profiles (before vs after a change)

```sh
node perf/analyze-cpuprofile.js --diff perf/profiles/before.cpuprofile perf/profiles/after.cpuprofile
```

Outputs:

- Per-category self-time delta.
- Top function self-time deltas (sorted by `|delta|`).

For a fair diff, capture both profiles using the **same scenario** and the **same device** in roughly the same conditions.

## Conventions

- Keep captured `.cpuprofile` files in `perf/profiles/` (gitignored).
- For diff comparisons, name them descriptively: `baseline.cpuprofile`, `step-8.cpuprofile`, `step-12.cpuprofile`, etc.
- Profiles MUST be captured in dev mode (Metro) so function names are intact. Release builds are minified and the analyzer output becomes useless.
