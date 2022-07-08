import type { ChannelAPIResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { TableRow } from '../types';

export const mapStorableToChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelRow: TableRow<'channels'>,
): Omit<
  ChannelAPIResponse<StreamChatGenerics>,
  'duration' | 'messages' | 'members' | 'pinned_messages'
> => {
  const extraData = channelRow.extraData ? JSON.parse(channelRow.extraData) : {};
  const { createdAt, createdById, deletedAt, lastMessageAt, type, updatedAt, ...rest } = channelRow;
  return {
    channel: {
      created_at: createdAt,
      created_by_id: createdById,
      deleted_at: deletedAt,
      last_message_at: lastMessageAt,
      type,
      updated_at: updatedAt,
      ...rest,
      ...extraData,
    },
  };
};
