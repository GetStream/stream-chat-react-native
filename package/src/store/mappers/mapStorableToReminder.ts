import type { ReminderResponseData } from 'stream-chat';

import { mapStorableToRequiredTimestamp, mapStorableToTimestamp } from './mapStorableToTimestamp';

import type { TableRow } from '../types';

export const mapStorableToReminder = (row: TableRow<'reminders'>): ReminderResponseData => {
  const { channelCid, createdAt, messageId, remindAt, updatedAt, userId } = row;

  return {
    channel_cid: channelCid,
    created_at: mapStorableToRequiredTimestamp(createdAt),
    message_id: messageId,
    remind_at: mapStorableToTimestamp(remindAt),
    updated_at: mapStorableToRequiredTimestamp(updatedAt),
    user_id: userId,
  };
};
