import { SqliteClient } from '../SqliteClient';

/**
 * Whether a channel row exists, which callers use to avoid writing a row whose `cid` foreign key
 * would not resolve.
 *
 * Deliberately `SELECT 1 ... LIMIT 1` rather than `SELECT EXISTS(...)`: `EXISTS` always returns
 * exactly one row (holding `0` or `1`), so the row COUNT carries no information and the previous
 * implementation reported `true` for every cid, existing or not. Returning zero rows for a miss is
 * what makes the answer readable without depending on the result column's name.
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
