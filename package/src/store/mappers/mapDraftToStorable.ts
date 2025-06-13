import type { DraftResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { TableRow } from '../types';

export const mapDraftToStorable = ({ draft }: { draft: DraftResponse }): TableRow<'draft'> => {
  const { channel_cid, created_at, parent_id, message, quoted_message } = draft;
  const createdAt = mapDateTimeToStorable(created_at);

  return {
    cid: channel_cid,
    createdAt,
    draftMessageId: message.id,
    parentId: parent_id,
    quotedMessageId: quoted_message?.id,
  };
};
