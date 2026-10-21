import type { ReactionFilters, SortParamRequest } from 'stream-chat';

import { tables } from '../../schema';
import { SqliteClient } from '../../SqliteClient';
import type { Scalar, TableRowJoinedUser } from '../../types';

/**
 * Fetches the reactions of the given messages. Only the `type` filter and sorting by `created_at`
 * are supported.
 *
 * @param messageIds The IDs of the messages to fetch reactions for.
 * @param limit Maximum number of reactions to return, or `null` for no limit. Defaults to 25.
 * @param filters Reaction filters. Only `type` is supported.
 * @param sort Reaction sort. Only `created_at` is supported.
 * @returns The reactions joined with their users.
 */
export const selectReactionsForMessages = async (
  messageIds: string[],
  limit: number | null = 25,
  filters?: Pick<ReactionFilters, 'type'>,
  sort?: SortParamRequest[],
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
  const createdAtSort = sort?.find((s) => s.field === 'created_at')?.direction;
  const orderByClause = createdAtSort
    ? `ORDER BY a.createdAt ${createdAtSort === 1 ? 'ASC' : 'DESC'}`
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
    [...messageIds, ...filterValue, ...(limit ? [limit] : [])] as Scalar[],
  );

  return result.map((r) => JSON.parse(r.value));
};
