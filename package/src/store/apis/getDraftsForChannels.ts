import { DraftResponse } from 'stream-chat';

import { selectMessageForId } from './queries/selectMessageById';

import { mapStorableToDraft } from '../mappers/mapStorableToDraft';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';
import { TableRow } from '../types';

export const getDraftForChannels = async ({
  channelIds,
  currentUserId,
}: {
  channelIds: string[];
  currentUserId: string;
}) => {
  SqliteClient.logger?.('info', 'getDraftsForChannel', { channelIds });

  const query = createSelectQuery('draft', ['*'], { cid: channelIds });

  const rows = await SqliteClient.executeSql.apply(null, query);

  const cidVsDrafts: Record<string, DraftResponse> = {};

  for (const row of rows) {
    const draftMessageQuery = createSelectQuery('draftMessage', ['*'], {
      id: row.draftMessageId,
    });
    const draftMessageRows = await SqliteClient.executeSql.apply(null, draftMessageQuery);

    const channelQuery = createSelectQuery('channels', ['*'], { cid: row.cid });
    const channelRows = await SqliteClient.executeSql.apply(null, channelQuery);

    const quotedMessageRow = await selectMessageForId(row.quotedMessageId);

    const polls = (await SqliteClient.executeSql.apply(
      null,
      createSelectQuery('poll', ['*'], {
        id: quotedMessageRow?.poll_id,
      }),
    )) as unknown as TableRow<'poll'>[];

    cidVsDrafts[row.cid] = mapStorableToDraft({
      channelRow: channelRows[0] as unknown as TableRow<'channels'>,
      currentUserId,
      draftMessageRow: draftMessageRows[0] as unknown as TableRow<'draftMessage'>,
      draftRow: row as unknown as TableRow<'draft'>,
      pollRow: polls[0],
      quotedMessageRow,
    });
  }
  return cidVsDrafts;
};
