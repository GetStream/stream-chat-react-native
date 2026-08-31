import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, StreamChat, UserResponse } from 'stream-chat';

import { convertDateToTimestamp } from '../generator/time';

export default (
  client: StreamChat,
  user: UserResponse,
  channel: Partial<ChannelResponse> = {},
  payload: Partial<Event> = {},
): Event => {
  const newDate = convertDateToTimestamp();
  const event = fromPartial<Event>({
    channel,
    cid: channel.cid,
    created_at: newDate,
    received_at: newDate,
    type: 'message.read',
    user,
    ...payload,
  });
  client.dispatchEvent(event);

  return event;
};
