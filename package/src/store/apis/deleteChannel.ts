import { DB_NAME } from '../constants';
import { closeDB } from '../utils/closeDB';
import { openDB } from '../utils/openDB';

export const deleteChannel = ({ cid }: { cid: string }) => {
  openDB();
  sqlite.executeSql(DB_NAME, `DELETE FROM channels where cid = ?`, [cid]);
  closeDB('deleteChannel');
};
