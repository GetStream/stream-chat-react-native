import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, StreamChat } from 'stream-chat';

export default (client: StreamChat, _channel: Partial<ChannelResponse> = {}) => {
  client.dispatchEvent(
    fromPartial<Event>({
      type: 'notification.channel_mutes_updated',
    }),
  );
};
