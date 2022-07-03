import { tables } from '../../schema';
import type { JoinedMessageRow } from '../../types';
import { selectQuery } from '../../utils/selectQuery';

export const selectMembersForChannels = (cids: string[]): JoinedMessageRow[] => {
  const questionMarks = Array(cids.length).fill('?').join(',');
  const membersColumnNames = Object.keys(tables.members.columns)
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
