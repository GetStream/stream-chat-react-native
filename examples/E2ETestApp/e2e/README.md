# E2E tests (Detox)

End-to-end tests for the SDK, driving `examples/E2ETestApp` with [Detox](https://wix.github.io/Detox/) against the shared
[`stream-chat-test-mock-server`](https://github.com/GetStream/stream-chat-test-mock-server). The layout mirrors the
native iOS/Android (and Flutter) suites, so tests can be ported almost line by line:

| Path                                        | What                                                                               | Native counterpart                           |
| ------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- |
| `mock-server/`                              | `MockServer` (driver `/start/:test` → per-test server), `DataTypes`                | `MockServer.kt`, `StreamMockServer.swift`    |
| `robots/BackendRobot.ts`                    | server-side state via test-control endpoints (`/mock`, `/add_member`, `/jwt/*`, …) | `BackendRobot`                               |
| `robots/ParticipantRobot.ts`                | the other user, `count_dooku` (`/participant/*`)                                   | `ParticipantRobot`                           |
| `robots/UserRobot.ts` + `UserRobot*Asserts` | UI actions as the app user + assert extensions                                     | `UserRobot` + `UserRobot*Asserts.kt`         |
| `pages/`                                    | page objects: `LoginPage`, `ChannelListPage`, `MessageListPage`                    | `pages/*Page.kt`, `Pages/*Page.swift`        |
| `support/`                                  | `setUpStreamTestCase()`, `step()`, uiautomator-like `Element` helpers              | `StreamTestCase`, `step {}`, `uiautomator/*` |
| `tests/*.e2e.ts`                            | the tests                                                                          | `*Tests.kt`, `*_Tests.swift`                 |

Robots are fluent like the native ones; every call is queued and the chain runs when awaited:

```ts
await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
await step('WHEN participant sends a message', () => participantRobot.sendMessage('Hi'));
await step('THEN user receives it', () => userRobot.assertMessage('Hi').assertMessageAuthor(false));
```

## The app

`examples/E2ETestApp` exists only for this suite, like the native SDKs' `StreamChatUITestsApp`. It has the SDK, its
required peer dependencies, and the optional peers the tested features need (the pickers that show the composer's attach
button, clipboard, video), and nothing else: no Firebase, maps or navigation library. That keeps native builds short (a
clean Release build is ~2 min on an M-series Mac, versus ~15 min for the SampleApp on Android). Its screens
(`App.tsx`), laid out like the SampleApp's so the same SDK paths run: a user selector; the root screen with a Channels /
Threads tab bar (`ChannelList`, `ThreadList`); a channel stacked over it; a thread stacked over the channel (the covered
channel stays mounted but hidden, like a native stack); and the SDK's channel details, opened from "View Info" in the
channel actions sheet. The `JWT_TEST` launch argument opens a JWT test screen instead (`src/JwtScreen.tsx`, used by
`AuthTests`).

`setUpStreamTestCase()` starts a mock server per test (`/start/<test>?api_version=v2&timestamps=ns`: stream-chat-js v10
calls the v2 API and reads every timestamp as unix nanoseconds, so the mock must send them that way) and relaunches the
app with the launch argument
`MOCK_SERVER_URL` (`localhost` on iOS, `10.0.2.2` on the Android emulator), read in `src/config.ts` via
`react-native-launch-arguments`. The app only lists the mock user (`luke_skywalker`) and never persists a login. Offline
support is on (`@op-engineering/op-sqlite`, `<Chat enableOfflineSupport>`), as in the native test apps, so offline sends
and reactions are queued; the login empties the database first, so every test starts clean.

## Running

The fastlane lanes live with the repo's other lanes in `examples/SampleApp/fastlane` (run them from
`examples/SampleApp`). The e2e app has no Gemfile of its own; `e2e_pod_install` installs its pods with that bundle.

```bash
bundle exec fastlane e2e_pod_install                     # once, and after native dependency changes
# Everything: clones + starts the mock server, builds, tests, stops the mock server
bundle exec fastlane test_e2e platform:ios
bundle exec fastlane test_e2e platform:android          # AVD from DETOX_AVD_NAME (default Pixel_API_37)
# Options: configuration:debug, skip_build:true, local_server:<path to a mock server checkout>,
#          mock_server_branch:<branch>, test:e2e/tests/MessageListTests.e2e.ts,
#          selection:<select_e2e_tests output>, coverage:true (see Impact analysis)

# Or by hand (yarn commands in examples/E2ETestApp)
bundle exec fastlane start_mock_server                   # driver on MOCK_DRIVER_PORT (default 4569)
yarn e2e:build -c ios.sim.release                        # or android.emu.release
MOCK_DRIVER_PORT=4569 yarn e2e:test -c ios.sim.release
bundle exec fastlane stop_mock_server
```

Android builds only the `arm64-v8a` and `x86_64` ABIs (emulators); set `ORG_GRADLE_PROJECT_reactNativeArchitectures` to
narrow it further.

Release configurations bundle the JS, so no Metro is needed. Debug configurations need `yarn start`. Android builds need
JDK 17 or 21 (`JAVA_HOME`).

## Allure TestOps

Every test links to a case in Allure TestOps project 3 (`stream-chat-react-native`, https://streamio.testops.cloud) with
`allureId(<case id>)` from `support/step.ts`; `step()` reports each GIVEN / WHEN / THEN as an Allure step.
`jest-allure2-reporter` writes `allure-results/`, and the lanes in `examples/SampleApp/fastlane/Allurefile` (imported by
the Fastfile, as on iOS) talk to TestOps: `allure_launch` / `allure_upload` / `allure_launch_removal` create the launch
and upload the results on CI, and `allure_testcase` creates a case and prints its id. They need `ALLURE_TOKEN` (a
repository secret on CI). A new test gets a new case: create it in project 3 (`allure_testcase`, or
`POST /api/rs/testcase` with `name`, `fullName: "<Suite>.<test>"`, `automated: true`) rather than reusing a native SDK's
ID; the native projects are separate.

## Ported tests

The suites port the Android compose and iOS UIKit suites (the union of both, one test per scenario), keeping the native
test names and expectations. Where the SDK disagrees with the native expectation, the test is skipped with
`it.skip` and a comment linking the Linear ticket. Not ported, because the RN SDK has no counterpart: the Android-only
grouped channel lists, channel/message/member search, reminders, push notifications (app-level in RN), Android's
`BackendTests` (real backend), hard delete from the message menu, iOS read counts and the iOS scroll performance tests.
Tests that cut the network run only on Android (`itOnAndroid`): the iOS simulator shares the Mac's connection.
Tests that take the Android CI emulator down run only on iOS (`itOnIOS`), with a comment linking the ticket.

## Impact analysis

Like the native SDKs, a pull request runs only the tests its diff can reach, read from a per-test coverage map that a
nightly run rebuilds. Other events (dispatch, the nightly) run everything.

- **Coverage.** `E2E_COVERAGE=1` at bundle time (`babel.config.js`; the Android build passes `--reset-cache` so Gradle
  never reuses the other kind of bundle) adds `e2e/coverage/babelPlugin.js`. It marks a file in
  `globalThis.__e2eCoverage` when any of its functions runs. Metro loads nearly every module at startup, so a module
  body counts only when it has no functions or does something at the top level (a call, an `if`); `X.displayName = …`
  doesn't count. It is not istanbul: react-native-worklets would capture istanbul's module-scoped counters into every
  worklet, which then throws on the UI runtime; `globalThis` is a worklet global. The instrumented code
  (`e2e/coverage/sources.js`) is `package/src`, `package/native-package/src` and the app, without tests and mock
  builders.
- **Collection.** With `E2E_COVERAGE_DIR` set (`test_e2e coverage:true`), `StreamTestCase` starts a collector on
  `E2E_COVERAGE_PORT` (4570) and passes the app `E2E_COVERAGE_URL`. After each test it sends the app home, the app posts
  its marks on going to the background (`src/e2eCoverage.ts`), and `e2e/support/Coverage.ts` writes
  `e2e-coverage/<test file>/<test>/lcov.info`. Every tracked source file is listed, also those never loaded: type-only
  modules leave the bundle, so a change to one selects no tests instead of all of them.
- **Map.** `fastlane build_e2e_coverage_map` turns those into `e2e_coverage_map.json` (`build_test_coverage_map` from
  `fastlane-plugin-stream_actions`). Test ids are `<test file>/<test>`, e.g. `MessageListTests.e2e/test_x`. A test
  whose last Allure result failed keeps its coverage from the previous map, or leaves the map until it passes.
- **Selection.** `fastlane select_e2e_tests` (`select_impacted_tests`) writes `e2e_selection.json`. A changed source
  selects the tests that ran it; one that ≥90% of the tests run selects one test per file. A changed test file selects
  its own tests. The harness (`e2e/` outside `tests/`), the app's native and build setup, the SDK's native code,
  dependencies, the lanes and the e2e workflows run everything, as does a missing or week-old map. Tests that aren't in
  the map yet always run. `E2E_SELECTION=<file>` makes `e2e/jest.config.js` run only the selected tests.

Locally (the map comes from a coverage run, or from the `e2e-coverage-map` artifact of the nightly):

```bash
bundle exec fastlane test_e2e platform:android coverage:true    # builds instrumented, collects per test
bundle exec fastlane build_e2e_coverage_map
bundle exec fastlane select_e2e_tests coverage_map:examples/E2ETestApp/e2e_coverage_map.json changed_files:<a>,<b>
bundle exec fastlane test_e2e platform:android skip_build:true selection:examples/E2ETestApp/e2e_selection.json
```

For a debug build, start Metro with `E2E_COVERAGE=1 yarn start --reset-cache`; switching back needs `--reset-cache`
too. A coverage build left in `android/app/build` or `ios/build` stays instrumented until rebuilt.

## CI

`.github/workflows/e2e-test.yml` runs on pull requests and on demand (`workflow_dispatch`, with iOS/Android toggles and
a mock server branch). Like the iOS SDK, a cheap `Check E2E Required` job first runs `fastlane e2e_check_required`
(`is_check_required` over the `e2e` sources in the Fastfile's `impact_analysis`, then `select_e2e_tests`; it checks
out 2 commits to diff the merge commit against its base). The simulator/emulator jobs run only when the PR touches
those sources and the selection isn't empty, or when the last change to them hasn't passed yet; they run the
`e2e-selection` artifact's tests. `Test E2E Result` is the job to require in branch protection: it passes when the e2e
jobs pass or are skipped as not required.

Android splits the tests like the native Android SDK: `Build Android` builds (or restores) the APKs once and uploads
them, `Launch Allure TestOps (Android)` creates one launch for all batches, and `Test Android` runs a matrix of up to 8
batches (`e2e_batches` from `e2e_check_required`: one per selected test when fewer than 8 are selected). Each batch
runs `test_e2e batch:<n> batch_count:<total>`, every `total`-th test of the selection, round-robin.

`.github/workflows/e2e-test-cron.yml` runs nightly on `develop` (and on demand, with iOS/Android toggles), reporting to
Allure as cron launches. iOS runs every test on the PR job's simulator setup, the only regular iOS run, since pull
requests run iOS on dispatch only. Android runs every test with an instrumented build, then `build_e2e_coverage_map`,
and uploads the `e2e-coverage-map` artifact (14 days) that pull requests download. Until its first run on `develop`, every pull request runs everything ("no coverage map").

iOS runs on `macos-15` (Xcode 26.2, iPhone 17 Pro, `ios.sim.release`). Android runs on `ubuntu-latest` with KVM and an
API 36 x86_64 emulator (`android.att.release`). Both call `fastlane test_e2e skip_build:true`, which on CI adds
`--retries 2 --headless` and keeps failure logs and screenshots in `artifacts/`. Those and the mock server logs are
uploaded when a job fails.

What CI caches. The workflow doesn't run on `develop`, and GitHub only lets a PR restore caches from its own branch or
the base branch, so each PR fills its own: its first run builds cold, and later pushes to it reuse the caches.

- **The built app** (`.app`; release + test `.apk`), keyed on the app and SDK sources. A change that only touches
  `e2e/` reuses the binary and skips pods, Gradle and Xcode entirely.
- `node_modules` of `yarn workspaces focus e2etestapp`, so only the e2e app's dependency tree is installed.
- iOS: CocoaPods, ccache (the RN ccache wrappers need `CCACHE_BINARY` in the environment, which the workflow sets), the
  Detox framework.
- Android: Gradle (`gradle/actions/setup-gradle` with `cache-read-only: false`, `org.gradle.caching`), a single ABI
  (`x86_64`). The emulator matches the native Android SDK's e2e jobs (API 36 AOSP image, `pixel` profile, no snapshot);
  on API 34 (Google APIs image, then AOSP) it died mid-run with no crash output.
- The mock server's gems, keyed on the mock server revision.

## Gotchas

- iOS runs with Detox's idle synchronization off (`detoxEnableSynchronization: 0` in `StreamTestCase.ts`): it can wedge
  on RN's UIManager shadow queue, whose pending-work counter underflows to 2^64-1, so the app looks busy until the test
  times out. Robots wait explicitly instead, and taps retry while the target is not hittable yet (e.g. under the
  keyboard as it animates in). Android keeps Espresso's synchronization.
- Don't pass `permissions` to `device.launchApp` unless a test needs one: on iOS Detox applies each with
  `applesimutils --restartSB`, which restarts SpringBoard on every launch. That cost 1.5–3 min per test on CI (hitting the
  hook timeout) and ~15s locally.
- CI boots the simulator at the start of the job and pins it with `DETOX_IOS_UDID` (`.detoxrc.js`), so the boot
  overlaps with setup instead of delaying the first test by ~7 min.
- A freshly booted CI emulator can show "Quickstep isn't responding" (a launcher ANR). The dialog takes window focus, and
  every Espresso action then fails with "Waited for the root of the view hierarchy to have window focus". The
  `test_e2e` lane hides error dialogs and waits up to 60s for the emulator to settle, and `StreamTestCase` dismisses
  any ANR dialog before each Android launch (`support/AndroidSystemDialogs.ts`). Read the focus from
  `dumpsys window`: `dumpsys window windows` no longer prints `mCurrentFocus`.
- `detox test --reuse` does not reinstall the app. After rebuilding, run without it, or you test the old binary.
- Yarn's `enableScripts: false` skips Detox's postinstall; run `yarn detox build-framework-cache` once on a new machine.
- The SDK's shared native sources are synced into `stream-chat-react-native` and gitignored; `yarn e2e:build` and
  `e2e_pod_install` run `yarn sync-native` first.
- Don't commit `ios/E2ETestApp.xcodeproj` after `USE_CCACHE=1 pod install`: it writes machine-specific ccache paths into
  it.
- Detox replaces Jest's global `expect`. Use it for element expectations and `expect as jestExpect` from
  `@jest/globals` for values.
- Fabric mounts some views that carry a `testID` (`message-list-item-*`, `message-text-container`) empty, with their
  content as siblings. They are not usable as `withAncestor` scopes or visibility targets; the page objects scope message
  elements to `message-content-wrapper` or the message list instead.
- Detox iOS never reports avatars as visible (their remote image renders transparent until loaded), so avatar asserts
  check existence.
- A ported test keeps the native expectation. If the SDK disagrees, fix the SDK or skip the test against a ticket.
- Debug builds (Metro) are the fast local loop: the SDK is served from `package/src`, so testID changes need no rebuild.
  `index.js` turns LogBox off, because its warning toast covers the composer. Detox re-shells the jest command, so a
  `-t` filter with `|` needs inner quotes: `-t '"test_a|test_b"'`.
- The message menu renders through a portal and its items match twice: tap them with `{ index: 0 }`.
- On Android, a swipe on the inverted `message-flat-list` lands as a horizontal gesture; robots swipe
  `message-flat-list-wrapper` (`MessageList.scrollTarget`).
- `replaceText` doesn't fire the composer's suggestion triggers, so a lone `/` or `@` is typed as a key press.
- Don't call a robot chain method inside `perform()`: it waits on the queue it is running in. Use the plain helpers
  (`typeIntoComposer`, `editMessageNow`).
- Index 0 of a selector isn't the newest message; `indexFromBottom()` sorts matches by position.
