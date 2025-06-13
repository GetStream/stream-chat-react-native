import { selectDraftMessageFromDraft } from './queries/selectDraftMessageFromDraft';
import { selectMessageForId } from './queries/selectMessageById';

import { mapStorableToDraft } from '../mappers/mapStorableToDraft';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';
import { TableRow } from '../types';

export const getDraft = async ({
  cid,
  userId,
  parent_id,
}: {
  cid: string;
  userId: string;
  parent_id?: string;
}) => {
  SqliteClient.logger?.('info', 'getDraft', { cid, parent_id });

  try {
    const draftRowsWithMessage = await selectDraftMessageFromDraft({
      cid,
      parent_id: parent_id ?? null,
    });

    if (!draftRowsWithMessage) return null;

    const draftRowWithMessage = draftRowsWithMessage;

    if (!draftRowWithMessage) {
      return null;
    }

    const channelQuery = createSelectQuery('channels', ['*'], { cid });
    const channelRows = await SqliteClient.executeSql.apply(null, channelQuery);

    const quotedMessageRows = await selectMessageForId(draftRowWithMessage.quotedMessageId);

    const polls = (await SqliteClient.executeSql.apply(
      null,
      createSelectQuery('poll', ['*'], {
        id: quotedMessageRows?.poll_id,
      }),
    )) as unknown as TableRow<'poll'>[];

    return mapStorableToDraft({
      channelRow: channelRows[0] as unknown as TableRow<'channels'>,
      currentUserId: userId,
      draftRow: draftRowWithMessage,
      pollRow: polls[0],
      quotedMessageRow: quotedMessageRows,
    });
  } catch (error) {
    console.error('Error in getDraft:', error);
    throw error;
  }
};
