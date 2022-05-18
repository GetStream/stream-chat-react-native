import { closeDB } from './closeDB';

import { openDB } from './openDB';

import { DB_NAME } from '../constants';
import type { PreparedQueries } from '../types';

export const executeQueries = (queries: PreparedQueries[]) => {
  openDB();

  const res = sqlite.executeSqlBatch(DB_NAME, queries);

  if (res.status === 1) {
    console.error(`Query/queries failed. ${res.message}`);
  }

  closeDB();
};
