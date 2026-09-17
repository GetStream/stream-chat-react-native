import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat } from 'stream-chat';

/**
 * `connection.recovered` is the one connection event that survives: it reports that the client's own
 * post-reconnect reloads have finished, which no store can say. It carries no payload — the
 * `connection` discriminator it briefly had is gone, since only the socket ever recovers.
 */
export default (client: StreamChat) => {
  client.dispatchEvent(
    fromPartial<Event>({
      type: 'connection.recovered',
    }),
  );
};
