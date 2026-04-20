import { fromPartial } from '@total-typescript/shoehorn';
import type {
  ChannelResponse,
  Event,
  LocalMessage,
  MessageResponse,
  ReactionResponse,
  StreamChat,
} from 'stream-chat';

export default (
  client: StreamChat,
  reaction: ReactionResponse,
  message: MessageResponse | LocalMessage,
  channel: Partial<ChannelResponse> = {},
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      message: message as MessageResponse,
      reaction,
      type: 'reaction.new',
    }),
  );
};
