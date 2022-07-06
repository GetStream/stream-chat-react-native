import { QuickSqliteClient } from '../QuickSqliteClient';

export const deleteReactionsForMessage = ({ messageId }: { messageId: string }) => {
  QuickSqliteClient.executeSql(`DELETE FROM reactions where messageId = ?`, [messageId]);
};
