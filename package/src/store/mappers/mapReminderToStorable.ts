import type { ReminderResponseBase } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { TableRow } from '../types';

export const mapReminderToStorable = (reminder: ReminderResponseBase): TableRow<'reminders'> => {
  const { channel_cid, created_at, message_id, remind_at, updated_at, user_id } = reminder;

  return {
    channelCid: channel_cid,
    createdAt: mapDateTimeToStorable(created_at),
    messageId: message_id,
    remindAt: mapDateTimeToStorable(remind_at),
    updatedAt: mapDateTimeToStorable(updated_at),
    userId: user_id,
  };
};
