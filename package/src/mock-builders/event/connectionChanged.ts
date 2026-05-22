import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat } from 'stream-chat';

export default (client: StreamChat, online = true) => {
  client.dispatchEvent(
    fromPartial<Event>({
      online,
      type: 'connection.changed',
    }),
  );
};
