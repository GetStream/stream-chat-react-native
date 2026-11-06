import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, StreamChat, UserResponse } from 'stream-chat';

import { convertDateToTimestamp } from '../generator/time';

export default (
  client: StreamChat,
  channel: Partial<ChannelResponse> = {},
  payload: Partial<Event> = {},
  user: Partial<UserResponse> = {},
) => {
  const newDate = convertDateToTimestamp();
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      created_at: newDate,
      received_at: newDate,
      type: 'notification.mark_unread',
      user,
      ...payload,
    }),
  );
};
