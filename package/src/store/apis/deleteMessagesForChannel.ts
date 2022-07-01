import { DB_NAME } from '../constants';
import { closeDB } from '../utils/closeDB';
import { openDB } from '../utils/openDB';

export const deleteMessagesForChannel = ({ cid }: { cid: string }) => {
  openDB();
  sqlite.executeSql(DB_NAME, `DELETE FROM messages where cid = ?`, [cid]);
  closeDB();
};
