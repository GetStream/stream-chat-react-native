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
      cid: channel.cid,
      message: newMessage as MessageResponse,
      type: 'message.updated',
    }),
  );
};
