import { Schema, tables } from '../schema';
import type { PreparedQueries, TableColumnNames, TableRow } from '../types';

/**
 * Creates a simple upsert query for sqlite.
 *
 * @param {string} table Table name
 * @param {Object} row Table row to insert or update.
 * @param {Array} conflictCheckKeys Custom list of columns to check conflicts for - https://www.sqlite.org/lang_UPSERT.html. By default conflicts are checked on primary keys.
 * @returns {string} Final upsert query for sqlite
 */
export const createUpsertQuery = <T extends keyof Schema>(
  table: T,
  row: Partial<TableRow<T>>,
  conflictCheckKeys?: Array<TableColumnNames<T>>,
): PreparedQueries => {
  const filteredRow: typeof row = {};

  // In case of "DO UPDATE SET", we only want to update the properties which
  // are provided, and not set undefined properties in database.
  // E.g., channel date such as `own_capabilities` is only available in response of client.queryChannels or channel.query.
  // But its not available in `event.channel`. And our mapper functions such as mapChannelToStorable will set fields which are not available as undefined.
  // So when you execute upsert query for storable value of `event.channel` in `channels` table, it will
  // unset ownCapabilities field for that channel in `channels` table.
  for (const key in row) {
    if (row[key] !== undefined) {
      filteredRow[key] = row[key];
    }
  }
  const fields = Object.keys(filteredRow) as (keyof typeof row)[];

  const questionMarks = Array(Object.keys(fields).length).fill('?').join(',');
  const conflictKeys = conflictCheckKeys || tables[table].primaryKey;
  const conflictMatchersWithoutPK: string[] = (fields as string[])
    .filter((f) => !(conflictKeys as string[]).includes(f))
    .map((f) => `${f}=excluded.${f}`);

  const conflictConstraint =
    conflictKeys.length > 0
      ? `ON CONFLICT(${conflictKeys.join(',')}) DO UPDATE SET
  ${conflictMatchersWithoutPK.join(',')}`
      : '';

  return [
    `INSERT INTO ${table} (${fields.join(',')}) VALUES (${questionMarks}) ${conflictConstraint}`,
    Object.values(filteredRow),
  ];
};
