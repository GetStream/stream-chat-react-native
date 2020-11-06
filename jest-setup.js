import { registerNativeHandlers as registerNativeHandlersV1 } from './src/native';
import { registerNativeHandlers as registerNativeHandlersV2 } from './src/v2/native';

// eslint-disable-next-line no-underscore-dangle
const _consoleE = console.error;
console.error = (e) => {
  // For some reason following error gets rased from waitFor function.
  // Source of the error is in react-test-renderer, although cause of the
  // issue is unknown. Until we figure out the proper way to fix this issue,
  // following hack should work. We just suppress this particular error.
  // It should be safe since the error is only raised in dev environment
  // https://github.com/facebook/react/blob/b683c07ccce340b9d687683d5dd7347a4c866787/packages/react-dom/src/test-utils/ReactTestUtilsAct.js#L121
  if (e.indexOf('You called act(async () => ...) without await') === -1) {
    _consoleE(e);
  }
};
console.warn = () => {};

registerNativeHandlersV1({
  NetInfo: {
    addEventListener: () => {},
    fetch: () =>
      new Promise((resolve) => {
        resolve();
      }),
  },
  pickDocument: () => null,
  pickImage: () => null,
});

registerNativeHandlersV2({
  BlurView: () => null,
  NetInfo: {
    addEventListener: () => {},
    fetch: () =>
      new Promise((resolve) => {
        resolve();
      }),
  },
  pickDocument: () => null,
  pickImage: () => null,
});

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
