import { closeDB } from '../sqlite-utils/closeDB';
import { openDB } from '../sqlite-utils/openDB';
import { DB_NAME } from '../constants';

export const deleteChannel = ({ cid }: { cid: string }) => {
  openDB();
  sqlite.executeSql(DB_NAME, `DELETE FROM channels where cid = ?`, [cid]);
  closeDB();
};
