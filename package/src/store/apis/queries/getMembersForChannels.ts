import { schema } from '../../schema';
import type { JoinedMessageRow } from '../../types';
import { selectQuery } from '../../utils/selectQuery';

export const getMembersForChannels = (cids: string[]): JoinedMessageRow[] => {
  const questionMarks = cids.map((c) => '?').join(',');
  const membersColumnNames = Object.keys(schema.members)
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
        ${membersColumnNames}
      ) as value
    FROM members a
    LEFT JOIN
      users b
    ON b.id = a.userId 
    WHERE cid in (${questionMarks}) ORDER BY datetime(a.createdAt) DESC`,
    cids,
    'query members',
  );

  return result.map((r) => JSON.parse(r.value));
};
