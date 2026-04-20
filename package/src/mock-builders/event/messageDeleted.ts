import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelResponse, Event, MessageResponse, StreamChat } from 'stream-chat';

export default (
  client: StreamChat,
  message: MessageResponse,
  channel: Partial<ChannelResponse> = {},
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      message,
      type: 'message.deleted',
    }),
  );
};
