import type { ReminderResponseData } from 'stream-chat';

import { mapTimestampToStorable } from './mapTimestampToStorable';

import type { TableRow } from '../types';

export const mapReminderToStorable = (reminder: ReminderResponseData): TableRow<'reminders'> => {
  const { channel_cid, created_at, message_id, remind_at, updated_at, user_id } = reminder;

  return {
    channelCid: channel_cid,
    createdAt: mapTimestampToStorable(created_at),
    messageId: message_id,
    remindAt: mapTimestampToStorable(remind_at),
    updatedAt: mapTimestampToStorable(updated_at),
    userId: user_id,
  };
};
