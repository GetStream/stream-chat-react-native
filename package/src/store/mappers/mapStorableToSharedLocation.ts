import { SharedLocationResponseData } from 'stream-chat';

import type { TableRow } from '../types';

export const mapStorableToSharedLocation = (
  row: TableRow<'locations'>,
): SharedLocationResponseData => {
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
    created_at: new Date(createdAt),
    created_by_device_id: createdByDeviceId,
    end_at: endAt ? new Date(endAt) : undefined,
    latitude,
    longitude,
    message_id: messageId,
    updated_at: new Date(updatedAt),
    user_id: userId,
  };
};
