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
    message_text_updated_at,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    own_reactions,
    reaction_groups,
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
    messageTextUpdatedAt: mapDateTimeToStorable(message_text_updated_at),
    reactionGroups: JSON.stringify(reaction_groups),
    text,
    type,
    updatedAt: mapDateTimeToStorable(updated_at),
    userId: user?.id,
  };
};
