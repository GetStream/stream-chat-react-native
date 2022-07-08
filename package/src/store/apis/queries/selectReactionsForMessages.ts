import { QuickSqliteClient } from '../../QuickSqliteClient';
import { tables } from '../../schema';
import type { TableRowJoinedUser } from '../../types';

export const selectReactionsForMessages = (
  messageIds: string[],
): TableRowJoinedUser<'reactions'>[] => {
  const questionMarks = Array(messageIds.length).fill('?').join(',');
  const reactionsColumnNames = Object.keys(tables.reactions.columns)
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
        ${reactionsColumnNames}
      ) as value
    FROM reactions a
    LEFT JOIN
      users b
    ON b.id = a.userId 
    WHERE a.messageId in (${questionMarks})`,
    messageIds,
  );

  return result.map((r) => JSON.parse(r.value));
};
