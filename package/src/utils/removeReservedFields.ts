import type { MessageResponse } from 'stream-chat';

import type { MessageType } from '../components/MessageList/hooks/useMessageList';
import type { DefaultStreamChatGenerics } from '../types/types';

export const removeReservedFields = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: MessageType<StreamChatGenerics> | MessageResponse<StreamChatGenerics>,
): MessageType<StreamChatGenerics> | MessageResponse<StreamChatGenerics> => {
  const retryMessage = { ...message };
  const reserved = [
    'cid',
    'config',
    'created_at',
    'created_by',
    'deleted_at',
    'i18n',
    'latest_reactions',
    'own_reactions',
    'reaction_counts',
    'last_message_at',
    'member_count',
    'type',
    'updated_at',
    'reply_count',
  ];
  reserved.forEach((key) => {
    delete retryMessage[key];
  });

  return retryMessage;
};
