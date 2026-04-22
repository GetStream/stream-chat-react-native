import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat } from 'stream-chat';

export default (client: StreamChat) => {
  client.dispatchEvent(
    fromPartial<Event>({
      type: 'connection.recovered',
    }),
  );
};
