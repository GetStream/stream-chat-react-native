import { executeQueries } from './executeQueries';

import { tables } from '../schema';
import type { PreparedQueries } from '../types';

export const dropTables = () => {
  const queries: PreparedQueries[] = Object.keys(tables).map((table) => [
    `DROP TABLE ${table}`,
    [],
  ]);
  executeQueries(queries);
};
