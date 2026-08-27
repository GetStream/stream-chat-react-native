/* global require, module, __dirname, Object */

/**
 * Test-environment shim for `react-native-svg`'s `SvgTouchableMixin`.
 *
 * `react-native-svg` (<= 15.15.5) reads `Touchable.Mixin` off the `react-native` root. React Native
 * 0.87 dropped `Touchable` from the public API but deliberately keeps the runtime export alive for
 * exactly that call site - except it now installs it *after* the main export object, via
 * `Object.defineProperty(module.exports, 'Touchable', ...)`. That definition is both late and
 * non-enumerable, so it is lost through Babel's `_interopRequireWildcard`, which builds the
 * namespace object that `import { Touchable } from 'react-native'` reads by copying enumerable own
 * properties. Metro is unaffected - this is purely a Jest interop artefact.
 *
 * This is wired up through `moduleNameMapper` rather than `jest.mock()` on purpose. Mapping happens
 * in the resolver, so it also applies inside the separate module registry Jest uses to build
 * automocks (which is where four of the `ChannelDetails` suites hit this). A `jest.mock()` on
 * `react-native` in the shared setup would work too, but it would shadow the per-suite
 * `react-native` mocks some tests install, because Jest caches the first mock instance per module.
 *
 * The real mixin is returned unchanged, so SVG touch behaviour under test is untouched.
 *
 * Remove once `react-native-svg` stops depending on the `Touchable` mixin.
 */

const ReactNative = require('react-native');

if (!ReactNative.Touchable) {
  Object.defineProperty(ReactNative, 'Touchable', {
    configurable: true,
    enumerable: true,
    get: () => require('react-native/Libraries/Components/Touchable/Touchable').default,
  });
}

// Required by its full path (with extension) so the `SvgTouchableMixin$` mapper does not match it
// again and send us back here.
module.exports = require(
  `${__dirname}/../node_modules/react-native-svg/src/lib/SvgTouchableMixin.ts`,
);
