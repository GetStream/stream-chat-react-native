import { SqliteClient } from '../SqliteClient';

/**
 * Whether a channel row exists, which callers use to avoid writing a row whose `cid` foreign key
 * would not resolve.
 *
 * It selects `1 ... LIMIT 1` because `SELECT EXISTS(...)` always returns one row (`0` or `1`), so
 * the row count could not tell a hit from a miss.
 *
 * @param params.cid The channel CID.
 * @returns True when the channel exists.
 */
export const channelExists = async ({ cid }: { cid: string }) => {
  const channels = await SqliteClient.executeSql('SELECT 1 FROM channels WHERE cid = ? LIMIT 1', [
    cid,
  ]);

  SqliteClient.logger?.('info', 'channelExists', {
    cid,
  });

  return channels.length > 0;
};
