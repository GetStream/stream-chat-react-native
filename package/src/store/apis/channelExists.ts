import { SqliteClient } from '../SqliteClient';

export const channelExists = async ({ cid }: { cid: string }) => {
  const channels = await SqliteClient.executeSql(
    'SELECT EXISTS(SELECT 1 FROM channels WHERE cid = ?)',
    [cid],
  );

  SqliteClient.logger?.('info', 'channelExists', {
    cid,
  });

  return channels.length > 0;
};
