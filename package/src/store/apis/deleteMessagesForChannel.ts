import { DB_NAME } from '../constants';
import { closeDB } from '../sqlite-utils/closeDB';
import { openDB } from '../sqlite-utils/openDB';

export const deleteMessagesForChannel = ({ cid }: { cid: string }) => {
  openDB();
  sqlite.executeSql(DB_NAME, `DELETE FROM messages where cid = ?`, [cid]);
  closeDB('deleteMessagesForChannel');
};
