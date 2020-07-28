import { registerNativeHandlers } from './src/native';

registerNativeHandlers({
  NetInfo: {
    addEventListener: () => {},
    fetch: () =>
      new Promise((resolve) => {
        resolve();
      }),
  },
  pickImage: () => null,
  pickDocument: () => null,
});
