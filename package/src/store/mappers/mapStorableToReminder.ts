import { ReminderResponseBase } from 'stream-chat';

import type { TableRow } from '../types';

export const mapStorableToReminder = (row: TableRow<'reminders'>): ReminderResponseBase => {
  const { channelCid, createdAt, messageId, remindAt, updatedAt, userId } = row;

  return {
    channel_cid: channelCid,
    created_at: createdAt,
    message_id: messageId,
    remind_at: remindAt,
    updated_at: updatedAt,
    user_id: userId,
  };
};
