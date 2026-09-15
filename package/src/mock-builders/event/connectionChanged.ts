import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat } from 'stream-chat';

/**
 * Both connections report through `connection.changed`, and consumers narrow on `connection` — so a
 * dispatcher that omits it exercises nothing. Defaults to the socket, which is what almost every
 * test means; pass `'network'` to drive the device-network half.
 */
export default (client: StreamChat, online = true, connection: 'network' | 'ws' = 'ws') => {
  client.dispatchEvent(
    fromPartial<Event>({
      connection,
      online,
      type: 'connection.changed',
    }),
  );
};
