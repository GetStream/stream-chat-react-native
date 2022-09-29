import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export default {
  addEventListener(listener) {
    let unsubscribe;
    // For NetInfo >= 3.x.x
    if (NetInfo.fetch && typeof NetInfo.fetch === 'function') {
      unsubscribe = NetInfo.addEventListener(({ isConnected, isInternetReachable }) => {
        // Initialize with truthy value when internetReachable is still loading
        // if it resolves to false, listener is triggered with false value and network
        // status is updated
        listener(isInternetReachable === null ? isConnected : isConnected && isInternetReachable);
      });
      return unsubscribe;
    } else {
      // For NetInfo < 3.x.x
      unsubscribe = NetInfo.addEventListener('connectionChange', () => {
        // @ts-ignore
        NetInfo.isConnected.fetch().then((isConnected: NetInfoState) => {
          listener(isConnected);
        });
      });

      return unsubscribe.remove;
    }
  },

  fetch() {
    return new Promise((resolve, reject) => {
      // For NetInfo >= 3.x.x
      if (NetInfo.fetch && typeof NetInfo.fetch === 'function') {
        NetInfo.fetch().then(({ isConnected }) => {
          resolve(isConnected);
        }, reject);
      } else {
        // For NetInfo < 3.x.x
        // @ts-ignore
        NetInfo.isConnected.fetch().then((isConnected: NetInfoState) => {
          resolve(isConnected);
        }, reject);
      }
    });
  },
};
