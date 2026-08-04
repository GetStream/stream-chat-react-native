import type { ReminderResponseData } from 'stream-chat';

import type { TableRow } from '../types';

export const mapStorableToReminder = (row: TableRow<'reminders'>): ReminderResponseData => {
  const { channelCid, createdAt, messageId, remindAt, updatedAt, userId } = row;

  return {
    channel_cid: channelCid,
    created_at: new Date(createdAt),
    message_id: messageId,
    remind_at: remindAt ? new Date(remindAt) : undefined,
    updated_at: new Date(updatedAt),
    user_id: userId,
  };
};
