import { SharedLocationResponseData } from 'stream-chat';

import { mapStorableToRequiredTimestamp, mapStorableToTimestamp } from './mapStorableToTimestamp';

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
    created_at: mapStorableToRequiredTimestamp(createdAt),
    created_by_device_id: createdByDeviceId,
    end_at: mapStorableToTimestamp(endAt),
    latitude,
    longitude,
    message_id: messageId,
    updated_at: mapStorableToRequiredTimestamp(updatedAt),
    user_id: userId,
  };
};
