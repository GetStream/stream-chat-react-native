import { registerNativeHandlers } from '..';

const NetInfo = {
  isConnected: {
    fetch: async () => {
      await undefined;
      return true;
    },
  },
  removeEventListener: () => {},
  addEventListener: () => {},
};
registerNativeHandlers({
  NetInfo,
});
