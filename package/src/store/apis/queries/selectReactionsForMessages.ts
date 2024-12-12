import { tables } from '../../schema';
import { SqliteClient } from '../../SqliteClient';
import type { TableRowJoinedUser } from '../../types';

/**
 * Fetches reactions for a message from the database for messageIds.
 * @param messageIds The message IDs for which reactions are to be fetched.
 */
export const selectReactionsForMessages = async (
  messageIds: string[],
): Promise<TableRowJoinedUser<'reactions'>[]> => {
  const questionMarks = Array(messageIds.length).fill('?').join(',');
  const reactionsColumnNames = Object.keys(tables.reactions.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(tables.users.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  SqliteClient.logger?.('info', 'selectReactionsForMessages', {
    messageIds,
  });

  const result = await SqliteClient.executeSql(
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

  return result.map((r: { value: string }) => JSON.parse(r.value));
};
