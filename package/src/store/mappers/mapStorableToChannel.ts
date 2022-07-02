import type { ChannelAPIResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ChannelRow } from '../types';

export const mapStorableToChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelRow: ChannelRow,
): Omit<ChannelAPIResponse<StreamChatGenerics>, 'duration' | 'messages' | 'members'> => {
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
    pinned_messages: pinnedMessages,
  };
};
