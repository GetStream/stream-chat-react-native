import { registerNativeHandlers } from '..';

const NetInfo = {
  fetch: async () => {
    await undefined;
    return true;
  },
  addEventListener: () => {},
};
registerNativeHandlers({
  NetInfo,
});
