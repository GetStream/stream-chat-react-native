import { schema } from '../../schema';
import type { JoinedMessageRow } from '../../types';
import { selectQuery } from '../../utils/selectQuery';

export const getMessagesForChannels = (cids: string[]): JoinedMessageRow[] => {
  const questionMarks = cids.map((c) => '?').join(',');
  const messagesColumnNames = Object.keys(schema.messages)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(schema.users)
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
