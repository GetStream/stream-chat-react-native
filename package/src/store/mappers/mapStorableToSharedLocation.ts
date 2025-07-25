import { SharedLocationResponse } from 'stream-chat';

import type { TableRow } from '../types';

export const mapStorableToSharedLocation = (row: TableRow<'locations'>): SharedLocationResponse => {
  const {
    channelCid,
    createdAt,
    createdByDeviceId,
    endAt,
    latitude,
    longitude,
    messageId,
    updatedAt,
    userId,
  } = row;

  return {
    channel_cid: channelCid,
    created_at: createdAt,
    created_by_device_id: createdByDeviceId,
    end_at: endAt,
    latitude,
    longitude,
    message_id: messageId,
    updated_at: updatedAt,
    user_id: userId,
  };
};
