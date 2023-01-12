import type { FormatMessageResponse, MessageResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { TableRow } from '../types';

export const mapMessageToStorable = (
  message: MessageResponse | FormatMessageResponse,
): TableRow<'messages'> => {
  const {
    attachments,
    cid,
    created_at,
    deleted_at,
    id,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    latest_reactions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    own_reactions,
    reaction_counts,
    text,
    type,
    updated_at,
    user,
    ...extraData
  } = message;

  return {
    attachments: JSON.stringify(attachments),
    cid: cid || '',
    createdAt: mapDateTimeToStorable(created_at),
    deletedAt: mapDateTimeToStorable(deleted_at),
    extraData: JSON.stringify(extraData),
    id,
    reactionCounts: JSON.stringify(reaction_counts),
    text,
    type,
    updatedAt: mapDateTimeToStorable(updated_at),
    userId: user?.id,
  };
};
