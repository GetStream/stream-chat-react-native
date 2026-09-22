import NetInfo from '@react-native-community/netinfo';

import { StreamChat } from 'stream-chat';

import { netInfoStatusReporter } from '../useIsOnline';

/**
 * The reporter has to be named in the client's OWN options, not installed from an effect: until
 * something reports, the client mirrors its WebSocket into the device-network store, and a
 * socket-only failure then reads as the device having no network.
 */
describe('the NetInfo reporter at client construction', () => {
  it('is installed before anything renders, so the socket fallback is never reached', () => {
    const client = new StreamChat('key', {
      config: { client: { networkConnection: { statusReporter: netInfoStatusReporter } } },
    } as never);

    expect(client.networkConnection.config.statusReporter).toBe(netInfoStatusReporter);
    expect(NetInfo.addEventListener).toHaveBeenCalled();

    // A socket that comes up and dies must not move the DEVICE's status.
    const report = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
    report({ isConnected: true, isInternetReachable: true });
    expect(client.networkConnection.isOnline).toBe(true);

    /* eslint-disable no-underscore-dangle */
    client.wsConnection._setStatus({ isHealthy: true });
    client.wsConnection._setStatus({ isHealthy: false });
    /* eslint-enable no-underscore-dangle */

    expect(client.networkConnection.isOnline).toBe(true);
  });

  it('leaves the device unknown without one, and mirrors the socket instead', () => {
    const client = new StreamChat('key');

    expect(client.networkConnection.isOnline).toBeUndefined();

    /* eslint-disable no-underscore-dangle */
    client.wsConnection._setStatus({ isHealthy: true });
    client.wsConnection._setStatus({ isHealthy: false });
    /* eslint-enable no-underscore-dangle */

    // Fabricated from the socket: nothing knows anything about this device's network.
    expect(client.networkConnection.isOnline).toBe(false);
  });
});
