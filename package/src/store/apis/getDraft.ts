import { selectDraftMessageFromDraft } from './queries/selectDraftMessageFromDraft';
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

  const draftRowsWithMessage = await selectDraftMessageFromDraft([cid]);

  const draftRowWithMessage = draftRowsWithMessage[0];

  if (!draftRowWithMessage) {
    return undefined;
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
    currentUserId,
    draftRow: draftRowWithMessage,
    pollRow: polls[0],
    quotedMessageRow: quotedMessageRows,
  });
};
