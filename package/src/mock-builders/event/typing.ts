import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, StreamChat, UserResponse } from 'stream-chat';

export default (
  client: StreamChat,
  user: Partial<UserResponse> = {},
  channel: Partial<ChannelResponse> = {},
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      type: 'typing.start',
      user,
      user_id: user.id,
    }),
  );
};
