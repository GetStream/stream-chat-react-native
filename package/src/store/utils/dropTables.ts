import { executeQueries } from './executeQueries';

import { schema } from '../schema';
import type { PreparedQueries } from '../types';

export const dropTables = () => {
  const queries: PreparedQueries[] = Object.keys(schema).map((table) => [
    `DROP TABLE ${table}`,
    [],
  ]);
  executeQueries(queries);
};
