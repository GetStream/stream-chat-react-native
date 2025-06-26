import { DraftMessage } from 'stream-chat';

import { TableRow } from '../types';

export const mapDraftMessageToStorable = ({
  draftMessage,
}: {
  draftMessage: DraftMessage;
}): TableRow<'draftMessage'> => {
  const {
    id,
    custom,
    text,
    attachments,
    mentioned_users,
    parent_id,
    poll_id,
    quoted_message_id,
    show_in_channel,
    silent,
    type,
  } = draftMessage;

  return {
    attachments: attachments ? JSON.stringify(attachments) : undefined,
    custom: custom ? JSON.stringify(custom) : undefined,
    id,
    mentionedUsers: mentioned_users ? JSON.stringify(mentioned_users) : undefined,
    parentId: parent_id,
    poll_id,
    quotedMessageId: quoted_message_id,
    showInChannel: show_in_channel,
    silent,
    text,
    type,
  };
};
