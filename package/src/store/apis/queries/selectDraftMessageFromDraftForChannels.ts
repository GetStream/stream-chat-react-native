import { tables } from '../../schema';
import { SqliteClient } from '../../SqliteClient';
import type { TableRowJoinedDraftMessage } from '../../types';

export const selectDraftMessageFromDraftForChannels = async (
  cids?: string[],
): Promise<TableRowJoinedDraftMessage<'draft'>[]> => {
  if (!cids || cids.length === 0) {
    return [];
  }

  const questionMarks = Array(cids.length).fill('?').join(',');
  const draftColumnNames = Object.keys(tables.draft.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const draftMessageColumnNames = Object.keys(tables.draftMessage.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  SqliteClient.logger?.('info', 'selectDraftMessageFromDraftForChannels', {
    cids,
  });

  const result = await SqliteClient.executeSql(
    `SELECT
      json_object(
        'draftMessage', json_object(
          ${draftMessageColumnNames}
        ),
        ${draftColumnNames}
      ) as value
    FROM draft a
    LEFT JOIN
      draftMessage b
    ON b.id = a.draftMessageId
    WHERE cid in (${questionMarks}) ORDER BY datetime(a.createdAt) DESC`,
    cids,
  );

  return result.map((r) => JSON.parse(r.value));
};
