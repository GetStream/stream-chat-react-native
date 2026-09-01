import type { LocalMessage, MessageLabel, MessageResponse } from 'stream-chat';

import { mapTimestampToStorable } from './mapTimestampToStorable';

import type { TableRow } from '../types';

export const mapMessageToStorable = (
  message: MessageResponse | LocalMessage,
): TableRow<'messages'> => {
  const {
    attachments,
    cid,
    created_at,
    deleted_at,
    deleted_for_me,
    id,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    latest_reactions,
    message_text_updated_at,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    own_reactions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    poll,
    poll_id,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reminder,
    reaction_groups,
    shared_location,
    text,
    type,
    updated_at,
    user,
    ...extraData
  } = message;

  return {
    attachments: JSON.stringify(attachments),
    cid: cid || '',
    createdAt: mapTimestampToStorable(created_at),
    deletedAt: mapTimestampToStorable(deleted_at),
    deletedForMe: deleted_for_me,
    extraData: JSON.stringify(extraData),
    id,
    messageTextUpdatedAt: mapTimestampToStorable(message_text_updated_at),
    poll_id: poll_id || '',
    reactionGroups: JSON.stringify(reaction_groups),
    shared_location: JSON.stringify(shared_location),
    text,
    type: type as MessageLabel,
    updatedAt: mapTimestampToStorable(updated_at),
    userId: user?.id,
  };
};
