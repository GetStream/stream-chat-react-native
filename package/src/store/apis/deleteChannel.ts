import { QuickSqliteClient } from '../QuickSqliteClient';

export const deleteChannel = ({ cid }: { cid: string }) => {
  QuickSqliteClient.executeSql(`DELETE FROM channels where cid = ?`, [cid]);
};
