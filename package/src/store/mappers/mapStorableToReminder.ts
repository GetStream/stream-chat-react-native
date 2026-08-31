import type { ReminderResponseData } from 'stream-chat';

import { mapStorableToDateTime } from './mapStorableToDateTime';

import type { TableRow } from '../types';

export const mapStorableToReminder = (row: TableRow<'reminders'>): ReminderResponseData => {
  const { channelCid, createdAt, messageId, remindAt, updatedAt, userId } = row;

  return {
    channel_cid: channelCid,
    created_at: mapStorableToDateTime(createdAt) ?? 0,
    message_id: messageId,
    remind_at: mapStorableToDateTime(remindAt),
    updated_at: mapStorableToDateTime(updatedAt) ?? 0,
    user_id: userId,
  };
};
