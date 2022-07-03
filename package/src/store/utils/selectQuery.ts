import { closeDB } from './closeDB';
import { openDB } from './openDB';

import { DB_NAME } from '../constants';

export const selectQuery = (query: string, params: any[], debugString?: string) => {
  openDB();
  const timeStart = new Date().getTime();
  const { message, rows, status } = sqlite.executeSql(DB_NAME, query, params);
  const timeEnd = new Date().getTime();
  closeDB();
  console.log(`Time taken for: ${debugString}: `, timeEnd - timeStart);
  if (status === 1) {
    console.error(`${debugString} failed: ${message}`);
  }

  return rows ? rows._array : [];
};
