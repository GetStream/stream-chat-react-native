import { DraftResponse } from 'stream-chat';

import { mapStorableToChannel } from './mapStorableToChannel';
import { mapStorableToDraftMessage } from './mapStorableToDraftMessage';

import { mapStorableToMessage } from './mapStorableToMessage';

import type { TableRow, TableRowJoinedUser } from '../types';

export const mapStorableToDraft = ({
  currentUserId,
  draftRow,
  draftMessageRow,
  channelRow,
  pollRow,
  quotedMessageRow,
}: {
  currentUserId: string;
  draftRow: TableRow<'draft'>;
  draftMessageRow: TableRow<'draftMessage'>;
  channelRow: TableRow<'channels'>;
  pollRow: TableRow<'poll'>;
  quotedMessageRow?: TableRowJoinedUser<'messages'>;
}): DraftResponse => {
  const { createdAt, cid, parentId } = draftRow;

  const message = mapStorableToDraftMessage(draftMessageRow);

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
