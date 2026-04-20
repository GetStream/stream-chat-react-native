import { fromPartial } from '@total-typescript/shoehorn';
import type {
  ChannelResponse,
  Event,
  LocalMessage,
  MessageResponse,
  StreamChat,
} from 'stream-chat';

export default (
  client: StreamChat,
  newMessage: MessageResponse | LocalMessage,
  channel: Partial<ChannelResponse> = {},
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      channel_id: channel.id,
      channel_type: channel.type,
      cid: channel.cid,
      message: newMessage as MessageResponse,
      type: 'message.new',
      ...(newMessage.user ? { user: newMessage.user } : {}),
    }),
  );
};
