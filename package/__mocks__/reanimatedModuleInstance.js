/* global require, module, __dirname */

/**
 * Test-environment shim for Reanimated's `ReanimatedModule` singleton.
 *
 * Reanimated regression, introduced between 4.5.2 and 4.6.0 and STILL PRESENT IN 4.6.0 STABLE
 * (re-verified 2026-08-25): `initializeReanimatedModule()` calls `setCSSEventHandler()`
 * unconditionally at import time. On the JS-only `JSReanimated` backend
 * that Jest resolves to, that method *throws* (`[Reanimated] setCSSEventHandler is not available in
 * JSReanimated.`), whereas the native backend's stub is a harmless no-op. The result is that merely
 * requiring Reanimated's own official mock blows up, taking the whole suite with it.
 *
 * Wired through `moduleNameMapper` rather than `jest.mock()` for two reasons: mapping happens in the
 * resolver, so it applies inside the separate module registry Jest uses to build automocks (four
 * `ChannelDetails` suites hit this), and it survives suites that register their own
 * `react-native-reanimated` mock, whose factories win over anything in the shared setup.
 *
 * Device and simulator builds use the native backend and are unaffected.
 *
 * TODO: remove once Reanimated fixes this upstream - `JSReanimated.setCSSEventHandler` should be a
 * no-op like the native backend's stub in `NativeReanimated.ts`. Re-check on each Reanimated bump:
 * grep `setCSSEventHandler` in `src/initializers.native.ts` and `src/ReanimatedModule/js-reanimated/
 * JSReanimated.ts`. https://github.com/software-mansion/react-native-reanimated
 */

// Required by its full path (with the platform suffix and extension) so the
// `reanimatedModuleInstance$` mapper does not match it again and recurse back into this file.
const actual = require(
  `${__dirname}/../node_modules/react-native-reanimated/src/ReanimatedModule/reanimatedModuleInstance.native.ts`,
);

if (actual && actual.ReanimatedModule) {
  actual.ReanimatedModule.setCSSEventHandler = () => {};
}

module.exports = actual;
