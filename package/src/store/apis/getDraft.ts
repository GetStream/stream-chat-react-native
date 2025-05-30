import { selectMessageForId } from './queries/selectMessageById';

import { mapStorableToDraft } from '../mappers/mapStorableToDraft';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';
import { TableRow } from '../types';

export const getDraft = async ({
  cid,
  currentUserId,
  parent_id,
}: {
  cid: string;
  currentUserId: string;
  parent_id?: string;
}) => {
  SqliteClient.logger?.('info', 'getDraft', { cid, parent_id });

  const query = createSelectQuery('draft', ['*'], { cid, parentId: parent_id });

  const rows = await SqliteClient.executeSql.apply(null, query);

  if (!rows.length) return null;

  const draftRow = rows[0];

  const draftMessageQuery = createSelectQuery('draftMessage', ['*'], {
    id: draftRow.draftMessageId,
  });
  const draftMessageRows = await SqliteClient.executeSql.apply(null, draftMessageQuery);

  const channelQuery = createSelectQuery('channels', ['*'], { cid });
  const channelRows = await SqliteClient.executeSql.apply(null, channelQuery);

  const quotedMessageRows = await selectMessageForId(draftRow.quotedMessageId);

  const polls = (await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('poll', ['*'], {
      id: quotedMessageRows?.poll_id,
    }),
  )) as unknown as TableRow<'poll'>[];

  return mapStorableToDraft({
    channelRow: channelRows[0] as unknown as TableRow<'channels'>,
    currentUserId,
    draftMessageRow: draftMessageRows[0] as unknown as TableRow<'draftMessage'>,
    draftRow: draftRow as unknown as TableRow<'draft'>,
    pollRow: polls[0],
    quotedMessageRow: quotedMessageRows,
  });
};
