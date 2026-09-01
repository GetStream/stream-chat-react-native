import Database, { type Database as DatabaseType } from 'better-sqlite3';

import { generateMessage } from '../../mock-builders/generator/message';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapStorableToTimestamp } from '../mappers/mapStorableToTimestamp';
import { mapTimestampToStorable } from '../mappers/mapTimestampToStorable';
import { tables } from '../schema';
import { createCreateTableQuery } from '../sqlite-utils/createCreateTableQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { Table } from '../types';

/**
 * Timestamps are stored exactly as the API sends them: every date column is `INTEGER` holding unix
 * nanoseconds, with no conversion at either boundary. Nothing here is about formatting — it is
 * about the two things `tsc` cannot see.
 *
 * 1. **Precision.** A nanosecond timestamp (~1.79e18) sits far above `Number.MAX_SAFE_INTEGER`, so
 *    the obvious worry is that SQLite quantises it further. It does not: by the time `JSON.parse`
 *    has read the HTTP response the value is already an integral `double`, and an integral double
 *    below 2^63 round-trips through `INTEGER` storage exactly. The tables here are built from the
 *    real `schema.ts`, so a column reverted to `TEXT` fails these assertions rather than silently
 *    truncating every timestamp to the millisecond — which is what the ISO columns used to do.
 * 2. **Absent means `NULL`, not `''`.** The ISO mapper this replaced wrote an empty string for an
 *    absent date, which is why `selectActiveLocationsForChannels`' `endAt IS NOT NULL` guard never
 *    actually filtered anything. `ORDER BY` placement and `IS NOT NULL` are invisible to the type
 *    system too.
 */
describe('timestamp storage', () => {
  /** A real on-device value, from the report that prompted the nanosecond work. */
  const NANOS = 1786219962651957000;
  const CID = 'messaging:general';

  let db: DatabaseType;

  beforeEach(() => {
    db = new Database(':memory:');
    // Every table, from the real schema: better-sqlite3 enables `PRAGMA foreign_keys` by default,
    // and `messages.cid` references `channels`.
    for (const table of Object.keys(tables) as Table[]) {
      for (const [query] of createCreateTableQuery(table)) {
        db.exec(query);
      }
    }
    db.prepare('INSERT INTO channels (cid) VALUES (?)').run([CID]);
  });

  afterEach(() => {
    db.close();
  });

  const insertMessage = (message: ReturnType<typeof generateMessage>) => {
    const [query, values] = createUpsertQuery('messages', mapMessageToStorable(message));
    db.prepare(query).run(values ?? []);
  };

  it('round-trips a nanosecond timestamp through the real schema without losing a digit', () => {
    const message = generateMessage({ cid: CID, timestamp: NANOS });

    insertMessage(message);

    const row = db
      .prepare('SELECT createdAt, typeof(createdAt) AS storageClass FROM messages WHERE id = ?')
      .get(message.id) as { createdAt: number; storageClass: string };

    expect(row.storageClass).toBe('integer');
    expect(row.createdAt).toBe(NANOS);
    // The whole point of the change: no truncation to the millisecond. ISO carried three decimal
    // places, so this assertion is what the previous storage format could not satisfy.
    expect(row.createdAt % 1e6).not.toBe(0);
  });

  it('survives the json_object projection the select queries read through', () => {
    // `selectMessagesForChannels` and friends do not select columns, they select a `json_object(…)`
    // blob and `JSON.parse` it — a second place precision could be lost, via SQLite's number
    // formatting rather than via storage.
    const message = generateMessage({ cid: CID, timestamp: NANOS });

    insertMessage(message);

    const { value } = db
      .prepare(`SELECT json_object('createdAt', createdAt) AS value FROM messages WHERE id = ?`)
      .get(message.id) as { value: string };

    expect(JSON.parse(value).createdAt).toBe(NANOS);
  });

  it('writes an absent timestamp as NULL so IS NOT NULL means something', () => {
    const message = generateMessage({ cid: CID, deleted_at: undefined, timestamp: NANOS });

    insertMessage(message);

    const row = db
      .prepare('SELECT typeof(deletedAt) AS storageClass FROM messages WHERE id = ?')
      .get(message.id) as { storageClass: string };

    expect(row.storageClass).toBe('null');
    expect(
      db.prepare('SELECT count(*) AS c FROM messages WHERE deletedAt IS NOT NULL').get(),
    ).toEqual({ c: 0 });
  });

  it('orders numerically, with a missing timestamp last', () => {
    const older = generateMessage({ cid: CID, timestamp: NANOS });
    const newer = generateMessage({ cid: CID, timestamp: NANOS + 1e9 });

    insertMessage(older);
    insertMessage(newer);
    db.prepare('INSERT INTO messages (id, cid, createdAt) VALUES (?, ?, NULL)').run([
      'no-timestamp',
      CID,
    ]);

    const ordered = db.prepare('SELECT id FROM messages ORDER BY createdAt DESC').all() as {
      id: string;
    }[];

    expect(ordered.map((r) => r.id)).toStrictEqual([newer.id, older.id, 'no-timestamp']);
  });

  describe('the null boundary the mappers exist for', () => {
    it('passes a present timestamp through untouched in both directions', () => {
      expect(mapTimestampToStorable(NANOS)).toBe(NANOS);
      expect(mapStorableToTimestamp(NANOS)).toBe(NANOS);
    });

    it('writes NULL for an absent timestamp, so an upsert clears rather than keeps it', () => {
      // `upsertStatementParts` drops `undefined` from the column list, which on an
      // upsert-**update** would leave the previous value in place.
      expect(mapTimestampToStorable(undefined)).toBeNull();
      expect(mapTimestampToStorable(null)).toBeNull();
    });

    it('reads NULL back as undefined, which is what the response types use', () => {
      expect(mapStorableToTimestamp(null)).toBeUndefined();
      expect(mapStorableToTimestamp(undefined)).toBeUndefined();
    });
  });
});
