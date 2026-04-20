import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, StreamChat, UserResponse } from 'stream-chat';

export default (client: StreamChat, user: UserResponse, channel: Partial<ChannelResponse> = {}) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      type: 'user.updated',
      user,
    }),
  );
};
