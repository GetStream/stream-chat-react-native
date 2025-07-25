import type { SharedLocationResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { TableRow } from '../types';

export const mapSharedLocationToStorable = (
  location: SharedLocationResponse,
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
    createdAt: mapDateTimeToStorable(created_at),
    createdByDeviceId: created_by_device_id,
    endAt: mapDateTimeToStorable(end_at),
    latitude,
    longitude,
    messageId: message_id,
    updatedAt: mapDateTimeToStorable(updated_at),
    userId: user_id,
  };
};
