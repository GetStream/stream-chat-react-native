import type { LocalMessage, ScheduledMessageResponse } from 'stream-chat';

/** Whether a scheduled message quotes a message that no longer exists. */
export const hasDeletedQuote = ({ message }: Pick<ScheduledMessageResponse, 'message'>) =>
  !!message.quoted_message_id &&
  (!message.quoted_message || message.quoted_message.type === 'deleted');

/**
 * Whether the composer's quoted message is gone. Editing a scheduled message whose quote can't be
 * loaded leaves a placeholder with only the id.
 */
export const isDeletedQuotedMessage = (quotedMessage?: LocalMessage | null) =>
  !!quotedMessage && (quotedMessage.type === 'deleted' || !quotedMessage.created_at);
