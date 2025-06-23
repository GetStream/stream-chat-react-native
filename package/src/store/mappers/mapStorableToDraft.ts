import { DraftResponse } from 'stream-chat';

import { mapStorableToChannel } from './mapStorableToChannel';
import { mapStorableToDraftMessage } from './mapStorableToDraftMessage';

import { mapStorableToMessage } from './mapStorableToMessage';

import type { TableRow, TableRowJoinedDraftMessage, TableRowJoinedUser } from '../types';

export const mapStorableToDraft = ({
  currentUserId,
  draftRow,
  channelRow,
  pollRow,
  quotedMessageRow,
}: {
  currentUserId: string;
  draftRow: TableRowJoinedDraftMessage<'draft'>;
  channelRow: TableRow<'channels'>;
  pollRow: TableRow<'poll'>;
  quotedMessageRow?: TableRowJoinedUser<'messages'>;
}): DraftResponse => {
  const { createdAt, cid, parentId } = draftRow;

  const message = mapStorableToDraftMessage(draftRow.draftMessage);

  const channel = mapStorableToChannel(channelRow);

  const quotedMessage = quotedMessageRow
    ? mapStorableToMessage({ currentUserId, messageRow: quotedMessageRow, pollRow })
    : undefined;

  return {
    channel: channel.channel,
    channel_cid: cid,
    created_at: createdAt,
    message,
    parent_id: parentId,
    quoted_message: quotedMessage,
  };
};
