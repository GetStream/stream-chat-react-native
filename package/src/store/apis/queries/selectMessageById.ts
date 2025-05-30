import { tables } from '../../schema';
import { SqliteClient } from '../../SqliteClient';
import type { TableRowJoinedUser } from '../../types';

export const selectMessageForId = async (
  msgId?: string,
): Promise<TableRowJoinedUser<'messages'> | undefined> => {
  if (!msgId) {
    return undefined;
  }

  const messagesColumnNames = Object.keys(tables.messages.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(tables.users.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  SqliteClient.logger?.('info', 'selectMessagesForId', {
    msgId,
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
      *
      FROM messages
      WHERE id = ?
    ) a
    LEFT JOIN
      users b
    ON b.id = a.userId`,
    [msgId],
  );

  return result[0] ? JSON.parse(result[0].value) : undefined;
};
