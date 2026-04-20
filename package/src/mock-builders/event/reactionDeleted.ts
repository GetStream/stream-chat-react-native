import { fromPartial } from '@total-typescript/shoehorn';
import type {
  ChannelResponse,
  Event,
  MessageResponse,
  ReactionResponse,
  StreamChat,
} from 'stream-chat';

export default (
  client: StreamChat,
  reaction: ReactionResponse,
  message: MessageResponse,
  channel: Partial<ChannelResponse> = {},
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      message,
      reaction,
      type: 'reaction.deleted',
    }),
  );
};
