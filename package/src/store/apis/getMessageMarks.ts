import type { DBGetMessageMarksType, MessageMarkWithUserResponse } from 'stream-chat';

import { mapStorableToRequiredTimestamp } from '../mappers/mapStorableToTimestamp';
import { mapStorableToUser } from '../mappers/mapStorableToUser';
import { tables } from '../schema';
import { SqliteClient } from '../SqliteClient';
import type { Scalar, TableRowJoinedUser } from '../types';

/**
 * Fetches the stored marks on a message, newest first, with the users who made them. A marker the
 * database holds no user for comes back with only the user's ID.
 *
 * @param params.messageId The ID of the message.
 * @param params.filter Only `type` is supported.
 * @param params.limit Maximum number of marks to return.
 * @returns The marks.
 */
export const getMessageMarks = async ({
  filter,
  limit,
  messageId,
}: DBGetMessageMarksType): Promise<MessageMarkWithUserResponse[]> => {
  const userColumnNames = Object.keys(tables.users.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');
  const markColumnNames = Object.keys(tables.messageMarks.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');

  SqliteClient.logger?.('info', 'getMessageMarks', { filter, limit, messageId });

  // The same order as the server and `MessageMarkPaginator`: newest first, then by mark ID.
  const result = await SqliteClient.executeSql(
    `SELECT
      json_object(
        'user', json_object(
          ${userColumnNames}
        ),
        ${markColumnNames}
      ) as value
    FROM messageMarks a
    LEFT JOIN
      users b
    ON b.id = a.userId
    WHERE a.messageId = ? ${filter?.type ? 'AND a.type = ?' : ''}
    ORDER BY a.createdAt DESC, a.userId ASC, a.type ASC
    ${limit ? 'LIMIT ?' : ''}`,
    [messageId, ...(filter?.type ? [filter.type] : []), ...(limit ? [limit] : [])] as Scalar[],
  );

  return result.map((row) => {
    const { createdAt, type, user, userId } = JSON.parse(
      row.value,
    ) as TableRowJoinedUser<'messageMarks'>;
    return {
      created_at: mapStorableToRequiredTimestamp(createdAt),
      message_id: messageId,
      type,
      user: mapStorableToUser(user?.id ? user : { id: userId }),
      user_id: userId,
    };
  });
};
