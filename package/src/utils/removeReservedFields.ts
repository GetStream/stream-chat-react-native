import type { LocalMessage, MessageResponse } from 'stream-chat';

export const removeReservedFields = (
  message: LocalMessage | MessageResponse,
): LocalMessage | MessageResponse => {
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
    'reaction_groups',
    'last_message_at',
    'member_count',
    'message_text_updated_at',
    'type',
    'updated_at',
    'reply_count',
  ] as (keyof typeof message)[];

  reserved.forEach((key) => {
    delete retryMessage[key];
  });

  return retryMessage;
};
