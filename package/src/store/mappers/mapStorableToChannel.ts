import type { ChannelAPIResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ChannelRow } from '../types';

export const mapStorableToChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelRow: ChannelRow,
): Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration' | 'messages'> => {
  const members = channelRow.members ? JSON.parse(channelRow.members) : [];
  const pinnedMessages = channelRow.pinnedMessages ? JSON.parse(channelRow.pinnedMessages) : [];
  const extraData = channelRow.extraData ? JSON.parse(channelRow.extraData) : {};
  const { createdAt, updatedAt, ...rest } = channelRow;
  return {
    channel: {
      created_at: createdAt,
      updated_at: updatedAt,
      ...rest,
      ...extraData,
    },
    members,
    pinned_messages: pinnedMessages,
  };
};
