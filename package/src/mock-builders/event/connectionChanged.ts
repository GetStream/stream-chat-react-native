/* eslint no-underscore-dangle: 0 -- `_setStatus` is the SDK's own hook for faking socket status in
   tests; there is no public setter because only the socket itself should write it. */
import type { StreamChat } from 'stream-chat';

/**
 * Drives a connection status change.
 *
 * There is no `connection.changed` event any more — both connections are stores, and this writes to
 * whichever one is named. The name is kept because that is what the change means to a test, and
 * because the two facts are still distinct: the socket by default, `'network'` for the device.
 *
 * The socket path mirrors `StableWSConnection._applyHealth`, connection id included. A drop
 * invalidates the id, so anything waiting on one waits for the reconnect; coming back resolves it,
 * because `queryChannels({ watch: true })` and `channel.watch()` now block on an id rather than
 * degrading to an unwatched query. Skipping that bookkeeping leaves those requests hanging for the
 * whole test.
 */
export default (client: StreamChat, online = true, connection: 'network' | 'ws' = 'ws') => {
  if (connection === 'network') {
    client.networkConnection.setStatus(online);
    return;
  }

  if (online) {
    client.connectionIdManager.resolveConnectionId('dummy_connection_id');
  } else {
    client.connectionIdManager.invalidate();
  }

  client.wsConnection._setStatus({ isHealthy: online });
};
