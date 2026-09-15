import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat } from 'stream-chat';

export default (client: StreamChat, connection: 'network' | 'ws' = 'ws') => {
  client.dispatchEvent(
    fromPartial<Event>({
      connection,
      type: 'connection.recovered',
    }),
  );
};
