import { DraftResponse } from 'stream-chat';

import { selectDraftMessageFromDraftForChannels } from './queries/selectDraftMessageFromDraftForChannels';
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

  const draftRowsWithMessage = await selectDraftMessageFromDraftForChannels(channelIds);

  /**
   * Filter out drafts without a parent ID, as we will not show them in the channel.
   * The above `createSelectQuery` was not able to filter out drafts without a parent ID.
   * TODO: Fix the query to filter out drafts without a parent ID. This can be a bit faster.
   */
  const rowsWithoutParentID = draftRowsWithMessage.filter((row) => row.parentId === null);

  const cidVsDrafts: Record<string, DraftResponse> = {};

  for (const row of rowsWithoutParentID) {
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
      draftRow: row,
      pollRow: polls[0],
      quotedMessageRow,
    });
  }
  return cidVsDrafts;
};
