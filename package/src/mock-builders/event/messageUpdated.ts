import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, MessageResponse, StreamChat } from 'stream-chat';

export default (
  client: StreamChat,
  newMessage: MessageResponse,
  channel: Partial<ChannelResponse> = {},
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      message: newMessage,
      type: 'message.updated',
    }),
  );
};
