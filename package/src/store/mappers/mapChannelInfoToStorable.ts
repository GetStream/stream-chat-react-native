import type { ChannelResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { TableRow } from '../types';

export const mapChannelInfoToStorable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: ChannelResponse<StreamChatGenerics>,
): TableRow<'channels'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    cid,
    created_at,
    deleted_at,
    id,
    last_message_at,
    members,
    type,
    updated_at,
    ...extraData
  } = channel;

  return {
    cid,
    createdAt: mapDateTimeToStorable(created_at),
    deletedAt: mapDateTimeToStorable(deleted_at),
    extraData: JSON.stringify(extraData),
    id,
    lastMessageAt: mapDateTimeToStorable(last_message_at),
    type,
    updatedAt: updated_at,
  };
};
