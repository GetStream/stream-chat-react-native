import type { LocalMessage, MessageResponse } from 'stream-chat';

export const removeReservedFields = <T extends LocalMessage | MessageResponse>(message: T): T => {
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
  ] as (keyof T)[];

  reserved.forEach((key) => {
    delete retryMessage[key];
  });

  return retryMessage;
};
