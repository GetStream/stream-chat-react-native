import { tables } from '../../schema';
import type { JoinedMessageRow } from '../../types';
import { selectQuery } from '../../utils/selectQuery';

export const selectMessagesForChannels = (cids: string[]): JoinedMessageRow[] => {
  const questionMarks = Array(cids.length).fill('?').join(',');
  const messagesColumnNames = Object.keys(tables.messages.columns)
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
      WHERE cid in (${questionMarks})
    ) a
    LEFT JOIN
      users b
    ON b.id = a.userId 
    WHERE RowNum < 20`,
    cids,
    'query messages',
  );

  return result.map((r) => JSON.parse(r.value));
};
