import type { ReactionFilters, ReactionSort } from 'stream-chat';

import { tables } from '../../schema';
import { SqliteClient } from '../../SqliteClient';
import type { TableRowJoinedUser } from '../../types';

/**
 * Fetches reactions for a message from the database for messageIds.
 * @param messageIds The message IDs for which reactions are to be fetched.
 * @param limit The limit of how many reactions should be returned.
 * @param filters A ReactionFilter for the reactions we want to fetch. Only type is currently supported.
 * @param sort A sort for reactions to be used when querying. Custom data is currently not supported for sorting.
 */
export const selectReactionsForMessages = async (
  messageIds: string[],
  limit: number | null = 25,
  filters?: Pick<ReactionFilters, 'type'>,
  sort?: ReactionSort,
): Promise<TableRowJoinedUser<'reactions'>[]> => {
  const questionMarks = Array(messageIds.length).fill('?').join(',');
  const reactionsColumnNames = Object.keys(tables.reactions.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(tables.users.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');
  const filterValue = filters?.type
    ? [typeof filters.type === 'string' ? filters.type : filters.type.$eq]
    : [];
  const createdAtSort = Array.isArray(sort)
    ? sort.find((s) => !!s.created_at)?.created_at
    : sort?.created_at;
  const orderByClause = createdAtSort
    ? `ORDER BY cast(strftime('%s', a.createdAt) AS INTEGER) ${createdAtSort === 1 ? 'ASC' : 'DESC'}`
    : '';

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
    WHERE a.messageId in (${questionMarks}) ${filters?.type ? `AND a.type = ?` : ''}
    ${orderByClause}
    ${limit ? 'LIMIT ?' : ''}`,
    [...messageIds, ...filterValue, ...(limit ? [limit] : [])],
  );

  return result.map((r) => JSON.parse(r.value));
};
