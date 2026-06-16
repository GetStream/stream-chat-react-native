import { DraftMessage } from 'stream-chat';

import { TableRow } from '../types';

export const mapStorableToDraftMessage = (
  draftMessageRow: TableRow<'draftMessage'>,
): DraftMessage => {
  const {
    id,
    custom,
    text,
    attachments,
    mentionedChannel,
    mentionedGroupIds,
    mentionedHere,
    mentionedRoles,
    mentionedUsers,
    parentId,
    poll_id,
    quotedMessageId,
    showInChannel,
    silent,
    type,
  } = draftMessageRow;

  return {
    attachments: attachments ? JSON.parse(attachments) : undefined,
    custom: custom ? JSON.parse(custom) : undefined,
    id,
    mentioned_channel: mentionedChannel,
    mentioned_group_ids: mentionedGroupIds ? JSON.parse(mentionedGroupIds) : undefined,
    mentioned_here: mentionedHere,
    mentioned_roles: mentionedRoles ? JSON.parse(mentionedRoles) : undefined,
    mentioned_users: mentionedUsers ? JSON.parse(mentionedUsers) : undefined,
    parent_id: parentId,
    poll_id,
    quoted_message_id: quotedMessageId,
    show_in_channel: showInChannel,
    silent,
    text,
    type,
  };
};
