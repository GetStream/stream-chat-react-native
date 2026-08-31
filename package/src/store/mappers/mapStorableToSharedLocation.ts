import { SharedLocationResponseData } from 'stream-chat';

import { mapStorableToDateTime } from './mapStorableToDateTime';

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
    created_at: mapStorableToDateTime(createdAt) ?? 0,
    created_by_device_id: createdByDeviceId,
    end_at: mapStorableToDateTime(endAt),
    latitude,
    longitude,
    message_id: messageId,
    updated_at: mapStorableToDateTime(updatedAt) ?? 0,
    user_id: userId,
  };
};
