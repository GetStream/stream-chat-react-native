import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, StreamChat } from 'stream-chat';

export default (client: StreamChat, channel: Partial<ChannelResponse> = {}) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      type: 'channel.updated',
    }),
  );
};
