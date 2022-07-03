import { tables } from '../../schema';
import type { JoinedReactionRow } from '../../types';
import { selectQuery } from '../../utils/selectQuery';

export const selectReactionsForMessages = (messageIds: string[]): JoinedReactionRow[] => {
  const questionMarks = Array(messageIds.length).fill('?').join(',');
  const reactionsColumnNames = Object.keys(tables.reactions.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(tables.users.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  const result = selectQuery(
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
    'query reactions',
  );

  return result.map((r) => JSON.parse(r.value));
};
