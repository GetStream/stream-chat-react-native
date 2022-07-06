import { DB_NAME } from '../constants';
import { closeDB } from '../sqlite-utils/closeDB';
import { openDB } from '../sqlite-utils/openDB';

export const deleteReactionsForMessage = ({ messageId }: { messageId: string }) => {
  openDB();
  sqlite.executeSql(DB_NAME, `DELETE FROM reactions where messageId = ?`, [messageId]);
  closeDB();
};
