import { QuickSqliteClient } from '../../QuickSqliteClient';
import { tables } from '../../schema';
import type { TableRowJoinedUser } from '../../types';

export const selectMessages = (messageIds: string[]): TableRowJoinedUser<'messages'>[] => {
  const questionMarks = Array(messageIds.length).fill('?').join(',');
  const messagesColumnNames = Object.keys(tables.messages.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(tables.users.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  const result = QuickSqliteClient.executeSql(
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
          ORDER BY datetime(createdAt) DESC
        ) RowNum
      FROM messages
      WHERE id in (${questionMarks})
    ) a
    LEFT JOIN
      users b
    ON b.id = a.userId 
    WHERE RowNum < 200`,
    messageIds,
  );

  return result.map((r) => JSON.parse(r.value));
};
