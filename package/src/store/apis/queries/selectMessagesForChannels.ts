import { tables } from '../../schema';
import { SqliteClient } from '../../SqliteClient';
import type { TableRowJoinedUser } from '../../types';

export const selectMessagesForChannels = async (
  cids: string[],
): Promise<TableRowJoinedUser<'messages'>[]> => {
  const questionMarks = Array(cids.length).fill('?').join(',');
  const messagesColumnNames = Object.keys(tables.messages.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(tables.users.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  SqliteClient.logger?.('info', 'selectMessagesForChannels', {
    cids,
  });

  const result = await SqliteClient.executeSql(
    `SELECT
      json_object(
        'user', json_object(
          ${userColumnNames}
        ),
        ${messagesColumnNames}
      ) as value
    FROM (
      SELECT
        *,
        ROW_NUMBER() OVER (
          PARTITION BY cid
          ORDER BY createdAt DESC
        ) RowNum
      FROM messages
      WHERE cid in (${questionMarks})
    ) a
    LEFT JOIN
      users b
    ON b.id = a.userId
    WHERE RowNum < 25
    ORDER BY a.createdAt ASC`,
    cids,
  );

  return result.map((r) => JSON.parse(r.value));
};
