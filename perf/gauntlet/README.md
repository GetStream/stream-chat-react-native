# perf/gauntlet

Harness for the base-vs-head performance gauntlet: release builds with React's profiling renderer, a seeded
100-message channel, ~40 scenarios on FlatList and FlashList, per-component render/re-render numbers, thread CPU,
frames and session-level statistics. **The procedure, rules and pitfalls are in
`.claude/skills/perf-gauntlet/SKILL.md`; read it before running anything.** A full run takes 5-7 hours.

All output goes to `out/` and generated tokens to `runtime/generated/` (both gitignored). Nothing in the SampleApp
or the SDK is edited on disk; measurement changes are applied at bundle time.

| File                               | Role                                                                                                                                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runtime/probe.js`                 | in-app probe: fake DevTools hook (per-commit render/wall, per-component self/inclusive/renders/mounts), root Profiler (effects), Hermes GC, speed index, loaded-message counts, diag-only hook/context/areEqual tracking; flushes `BENCH` lines to logcat |
| `runtime/probe-llc.js`             | wraps `client.dispatchEvent` (ES import, so it patches the app's own stream-chat build)                                                                                                                                                                   |
| `runtime/entry-shim.js`            | loads the probe ahead of the SampleApp's first import                                                                                                                                                                                                     |
| `metro.gauntlet.config.js`         | wraps a SampleApp's Metro config: probe first, bench tokens, profiling renderer, kept fn names                                                                                                                                                            |
| `gauntlet-transformer.js`          | bundle-time patches: 100 messages per channel; diag-only `areEqual` instrumentation                                                                                                                                                                       |
| `gauntlet.init.gradle`             | points this checkout's RN gradle plugin at either side's SampleApp                                                                                                                                                                                        |
| `export-ref.sh`                    | `git archive` a ref into `out/trees/<label>` + install (no git writes)                                                                                                                                                                                    |
| `check-native-parity.cjs`          | refuses the one-native-binary build if native deps differ                                                                                                                                                                                                 |
| `build.sh`                         | release APK (arm64) for one side, optional `diag` variant                                                                                                                                                                                                 |
| `tokens.cjs`                       | static 7-day tokens for the bench users -> `runtime/generated/ChatUsers.gauntlet.ts`                                                                                                                                                                      |
| `lib.cjs`, `seed.cjs`, `actor.cjs` | backend: deterministic seed per device user; WS-connected other users driven over HTTP :9356                                                                                                                                                              |
| `devmark.sh`                       | on-device window marker with per-thread CPU ticks                                                                                                                                                                                                         |
| `preflight.sh`                     | gate before every session: host load, host memory / compressed emulator RAM, emulator nice, device CPU calibration                                                                                                                                        |
| `ui.py`, `find.py`                 | uiautomator driver (never used inside a window)                                                                                                                                                                                                           |
| `session.sh`                       | one measurement session (setup, warm-up, phases)                                                                                                                                                                                                          |
| `run.sh`                           | ABBA sequence of sessions from a frozen copy of `session.sh`                                                                                                                                                                                              |
| `analyze.py`                       | logcat -> `windows.json` per session                                                                                                                                                                                                                      |
| `report.py`                        | `main`, `lists`, `comps`, `ci`, `diff <scenario>`                                                                                                                                                                                                         |
| `diag.py`                          | diag builds: `hooks`, `ctx`, `areequal`                                                                                                                                                                                                                   |

Quick start (after reading the skill):

```bash
bash perf/gauntlet/export-ref.sh origin/develop base-tree
GAUNTLET_USER_PREFIX=g20261012 node perf/gauntlet/tokens.cjs 12
bash perf/gauntlet/build.sh base perf/gauntlet/out/trees/base-tree
bash perf/gauntlet/build.sh head .
(cd examples/SampleApp/android && ./gradlew --stop)   # then cold-boot the emulator
bash perf/gauntlet/preflight.sh
for n in 1 2 3 4; do node perf/gauntlet/seed.cjs g20261012_s$n; done
nohup node perf/gauntlet/actor.cjs > perf/gauntlet/out/actor.log 2>&1 &
RUNS=5 bash perf/gauntlet/run.sh main "setup warm cold list flat flash" base head g20261012_s1 g20261012_s2 g20261012_s3 g20261012_s4
python3 perf/gauntlet/report.py main perf/gauntlet/out/main
```
