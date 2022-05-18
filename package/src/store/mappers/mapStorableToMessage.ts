import type { MessageResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { MessageRow } from '../types';

export const mapStorableToMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  messageRow: MessageRow,
): MessageResponse<StreamChatGenerics> => {
  const { createdAt, deletedAt, extraData, updatedAt, ...rest } = messageRow;
  return {
    ...rest,
    attachments: messageRow.attachments ? JSON.parse(messageRow.attachments) : [],
    created_at: createdAt,
    deleted_at: deletedAt,
    updated_at: updatedAt,
    user: messageRow.user ? JSON.parse(messageRow.user) : {},
    ...JSON.parse(extraData || '{}'),
  };
};
