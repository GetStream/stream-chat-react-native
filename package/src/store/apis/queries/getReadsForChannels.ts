import { schema } from '../../schema';
import type { JoinedReadRow } from '../../types';
import { selectQuery } from '../../utils/selectQuery';

export const getReadsForChannels = (cids: string[]): JoinedReadRow[] => {
  const questionMarks = cids.map((c) => '?').join(',');
  const readsColumnNames = Object.keys(schema.reads)
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
        ${readsColumnNames}
      ) as value
    FROM reads a
    LEFT JOIN
      users b
    ON b.id = a.userId 
    WHERE a.cid in (${questionMarks})`,
    cids,
    'query reads'
  );

  return result.map((r) => JSON.parse(r.value));
};
