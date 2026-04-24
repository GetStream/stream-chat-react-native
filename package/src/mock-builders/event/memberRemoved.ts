import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelMemberResponse, ChannelResponse, Event, StreamChat } from 'stream-chat';

export default (
  client: StreamChat,
  member: ChannelMemberResponse,
  channel: Partial<ChannelResponse> = {},
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel,
      cid: channel.cid,
      member,
      type: 'member.removed',
      user: member.user,
    }),
  );
};
