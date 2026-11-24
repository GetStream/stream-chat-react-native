import type { MessageMarkResponse } from 'stream-chat';

import { mapTimestampToStorable } from './mapTimestampToStorable';

import type { TableRow } from '../types';

export const mapMessageMarkToStorable = (
  mark: Pick<MessageMarkResponse, 'created_at' | 'message_id' | 'type' | 'user_id'>,
): TableRow<'messageMarks'> => ({
  createdAt: mapTimestampToStorable(mark.created_at),
  messageId: mark.message_id,
  type: mark.type,
  userId: mark.user_id,
});
