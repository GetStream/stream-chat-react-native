import type { ChannelAPIResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ChannelRow } from '../types';

export const mapChannelToStorable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: ChannelAPIResponse<StreamChatGenerics>,
): ChannelRow => {
  const {
    channel: { cid, created_at, deleted_at, id, last_message_at, type, updated_at, ...extraData },
    pinned_messages,
  } = channel;

  return {
    cid,
    createdAt: created_at,
    deletedAt: deleted_at,
    extraData: JSON.stringify(extraData),
    id,
    lastMessageAt: last_message_at,
    pinnedMessages: JSON.stringify(pinned_messages),
    type,
    updatedAt: updated_at,
  };
};
