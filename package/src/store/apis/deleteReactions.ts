import { DB_NAME } from '../constants';
import { closeDB } from '../utils/closeDB';
import { openDB } from '../utils/openDB';

export const deleteReactionsForMessage = ({ messageId }: { messageId: string }) => {
  openDB();
  sqlite.executeSql(DB_NAME, `DELETE FROM reactions where messageId = ?`, [messageId]);
  closeDB();
};
