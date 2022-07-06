import { QuickSqliteClient } from '../QuickSqliteClient';

export const deleteMessagesForChannel = ({ cid }: { cid: string }) => {
  QuickSqliteClient.executeSql(`DELETE FROM messages where cid = ?`, [cid]);
};
