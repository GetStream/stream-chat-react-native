import type { ChannelAPIResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ChannelRow } from '../types';

export const mapChannelToStorable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: ChannelAPIResponse<StreamChatGenerics>,
): ChannelRow => {
  const {
    channel: { cid, created_at, id, updated_at, ...extraData },
    members,
    pinned_messages,
  } = channel;

  return {
    cid,
    createdAt: created_at,
    extraData: JSON.stringify(extraData),
    id,
    members: JSON.stringify(members),
    pinnedMessages: JSON.stringify(pinned_messages),
    updatedAt: updated_at,
  };
};
