import type { SharedLocationResponseData } from 'stream-chat';

import { mapTimestampToStorable } from './mapTimestampToStorable';

import type { TableRow } from '../types';

export const mapSharedLocationToStorable = (
  location: SharedLocationResponseData,
): TableRow<'locations'> => {
  const {
    channel_cid,
    created_at,
    created_by_device_id,
    end_at,
    latitude,
    longitude,
    message_id,
    updated_at,
    user_id,
  } = location;

  return {
    channelCid: channel_cid,
    createdAt: mapTimestampToStorable(created_at),
    createdByDeviceId: created_by_device_id,
    endAt: mapTimestampToStorable(end_at),
    latitude,
    longitude,
    messageId: message_id,
    updatedAt: mapTimestampToStorable(updated_at),
    userId: user_id,
  };
};
