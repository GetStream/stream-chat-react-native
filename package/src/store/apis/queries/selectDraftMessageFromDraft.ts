import { tables } from '../../schema';
import { SqliteClient } from '../../SqliteClient';
import { TableRowJoinedDraftMessage } from '../../types';

export const selectDraftMessageFromDraft = async ({
  cid,
  parent_id,
}: {
  cid: string;
  parent_id: string | null;
}): Promise<TableRowJoinedDraftMessage<'draft'> | undefined> => {
  const draftColumnNames = Object.keys(tables.draft.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const draftMessageColumnNames = Object.keys(tables.draftMessage.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  SqliteClient.logger?.('info', 'selectDraftMessageFromDraft', {
    cid,
    parent_id,
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
      WHERE a.cid = ? AND a.parentId is ?`,
    [cid, parent_id],
  );

  return result[0] ? JSON.parse(result[0].value) : undefined;
};
