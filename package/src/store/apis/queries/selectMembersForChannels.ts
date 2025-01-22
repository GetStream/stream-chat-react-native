import type { TableRowJoinedUser } from '../../../store/types';

import { tables } from '../../schema';
import { SqliteClient } from '../../SqliteClient';

export const selectMembersForChannels = async (
  cids: string[],
): Promise<TableRowJoinedUser<'members'>[]> => {
  const questionMarks = Array(cids.length).fill('?').join(',');
  const membersColumnNames = Object.keys(tables.members.columns)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(tables.users.columns)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  SqliteClient.logger?.('info', 'selectMembersForChannels', {
    cids,
  });

  const result = await SqliteClient.executeSql(
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
