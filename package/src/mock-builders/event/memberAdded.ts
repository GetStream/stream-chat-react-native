import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelMemberResponse, ChannelResponse, Event, StreamChat } from 'stream-chat';

export default (
  client: StreamChat,
  member: ChannelMemberResponse,
  channel: Partial<ChannelResponse> = {},
) => {
  client.dispatchEvent(
    fromPartial<Event>({
      channel_id: channel.id,
      channel_type: channel.type,
      cid: channel.cid,
      member,
      type: 'member.added',
      user: member.user,
    }),
  );
};
