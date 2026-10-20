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

`examples/E2ETestApp` exists only for this suite, like the native SDKs' `StreamChatUITestsApp`. It has the SDK and its
required peer dependencies, and nothing else: no Firebase, maps, video or navigation library. That keeps native builds
short (a clean Release build is ~2 min on an M-series Mac, versus ~15 min for the SampleApp on Android). It has three
screens: a user selector, the channel list, and a channel stacked on top of the list (`App.tsx`), laid out like the
SampleApp's, so the same SDK paths run.

`setUpStreamTestCase()` starts a mock server per test and relaunches the app with the launch argument
`MOCK_SERVER_URL` (`localhost` on iOS, `10.0.2.2` on the Android emulator), read in `src/config.ts` via
`react-native-launch-arguments`. The app only lists the mock user (`luke_skywalker`), never persists a login and runs
without offline storage, so every test starts clean.

## Running

The fastlane lanes live with the repo's other lanes in `examples/SampleApp/fastlane` (run them from
`examples/SampleApp`). The e2e app has no Gemfile of its own; `e2e_pod_install` installs its pods with that bundle.

```bash
bundle exec fastlane e2e_pod_install                     # once, and after native dependency changes
# Everything: clones + starts the mock server, builds, tests, stops the mock server
bundle exec fastlane test_e2e platform:ios
bundle exec fastlane test_e2e platform:android          # AVD from DETOX_AVD_NAME (default Pixel_API_37)
# Options: configuration:debug, skip_build:true, local_server:<path to a mock server checkout>,
#          mock_server_branch:<branch>, test:e2e/tests/MessageListTests.e2e.ts

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

## CI

`.github/workflows/e2e-test.yml` runs on pull requests and on demand (`workflow_dispatch`, with iOS/Android toggles and
a mock server branch). Like the iOS SDK, a cheap `Check E2E Required` job first runs `fastlane e2e_check_required`
(`is_check_required` over the `e2e` sources in the Fastfile's `impact_analysis`). The simulator/emulator jobs run
only when the PR touches those sources, or when the last change to them hasn't passed yet. `Test E2E Result` is the
job to require in branch protection: it passes when the e2e jobs pass or are skipped as not required.

iOS runs on `macos-15` (Xcode 26.2, iPhone 17 Pro, `ios.sim.release`). Android runs on `ubuntu-latest` with KVM and an
API 34 x86_64 emulator (`android.att.release`). Both call `fastlane test_e2e skip_build:true`, which on CI adds
`--retries 2 --headless` and keeps failure logs and screenshots in `artifacts/`. Those and the mock server logs are
uploaded when a job fails.

What CI caches (restored on PRs, filled by the runs on `develop`):

- **The built app** (`.app`; release + test `.apk`), keyed on the app and SDK sources. A change that only touches
  `e2e/` reuses the binary and skips pods, Gradle and Xcode entirely.
- `node_modules` of `yarn workspaces focus e2etestapp`, so only the e2e app's dependency tree is installed.
- iOS: CocoaPods, ccache (the RN ccache wrappers need `CCACHE_BINARY` in the environment, which the workflow sets), the
  Detox framework.
- Android: Gradle (`gradle/actions/setup-gradle`, `org.gradle.caching`), a single ABI (`x86_64`). The emulator matches the
  native Android SDK's e2e jobs (API 34 AOSP image, `pixel` profile, no snapshot): the Google APIs image plus a cached
  snapshot froze the emulator on the 5th app launch, two runs in a row.
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
