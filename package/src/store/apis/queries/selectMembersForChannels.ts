import type { TableRowJoinedUser } from 'src/store/types';

import { QuickSqliteClient } from '../../QuickSqliteClient';
import { tables } from '../../schema';

export const selectMembersForChannels = (cids: string[]): TableRowJoinedUser<'members'>[] => {
  const questionMarks = Array(cids.length).fill('?').join(',');
  const membersColumnNames = Object.keys(tables.members.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(tables.users.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  const result = QuickSqliteClient.executeSql(
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
  );

  return result.map((r) => JSON.parse(r.value));
};
