import type { _InternalDB, OPSQLiteProxy } from '@op-engineering/op-sqlite';
let sqlite: OPSQLiteProxy;

try {
  sqlite = require('@op-engineering/op-sqlite');
} catch (e) {
  // We want to throw the original error when remote debugger (e.g. Chrome) is enabled.
  // SQLite can only be used when synchronous method invocations (JSI) are possible.
  // e.g on-device debugger (e.g. Flipper).
  const isRemoteDebuggerError = e instanceof Error && e.message.includes('Failed to install');
  if (isRemoteDebuggerError) {
    throw e;
  }
  // Reaching here will mean that QuickSQLite is not installed for one of the reasons
  // 1. Running on regular expo, where we don't support offline storage yet.
  // 2. Offline support is disabled, in which case this library is not installed.
}

import type { Sink } from 'stream-chat';

import { DB_LOCATION, DB_NAME } from './constants';
import { tables } from './schema';
import { createCreateTableQuery } from './sqlite-utils/createCreateTableQuery';
import type { PreparedBatchQueries, PreparedQueries, Scalar, Table } from './types';

/**
 * Why the offline database could not be opened. The first two only arise when
 * {@link SqliteClient.getEncryptionKey} is set; `OFFLINE_DB_UNREADABLE` can also mean
 * plain corruption, or a database left behind from the other encryption mode.
 */
export type SqliteClientErrorCode =
  | 'SQLCIPHER_BUILD_MISSING'
  | 'ENCRYPTION_KEY_UNAVAILABLE'
  | 'OFFLINE_DB_UNREADABLE';

export class SqliteClientError extends Error {
  public readonly code: SqliteClientErrorCode;

  constructor(code: SqliteClientErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'SqliteClientError';
    this.code = code;
    // Assigned here rather than passed through `super(message, { cause })` because
    // Hermes does not reliably honour the ErrorOptions overload.
    this.cause = options?.cause;
  }
}

/**
 * SqliteClient takes care of any direct interaction with sqlite.
 * This way usage @op-engineering/op-sqlite package is scoped to a single class/file.
 */
export class SqliteClient {
  static dbVersion = 16;

  static dbName = DB_NAME;
  static dbLocation = DB_LOCATION;
  static logger: Sink | undefined;
  static db: _InternalDB | undefined;

  /**
   * Supplies the SQLCipher key the offline database is opened with; `undefined`
   * opens it unencrypted, which is the default. The key must be stable for the
   * lifetime of the database file - there is no rekey path, so a database this key
   * cannot read raises `OFFLINE_DB_UNREADABLE` on the first page read. The file is
   * left untouched; recovery is `SqliteClient.deleteDatabase()` and a re-mount.
   */
  static getEncryptionKey: (() => Promise<string | undefined>) | undefined;

  /** Key resolved by {@link preflightEncryption}, consumed by the next {@link openDB}. */
  private static preflightedKey: string | undefined;

  /** Busy/disk/memory failures. Checked first: wiping over these destroys a good db. */
  private static TRANSIENT_ERROR =
    /database is locked|SQLITE_BUSY|SQLITE_LOCKED|disk i\/o|SQLITE_IOERR|unable to open|SQLITE_CANTOPEN|out of memory|readonly/i;

  /**
   * The bytes on disk cannot be read with the key we have: wrong/rotated key,
   * plaintext-encrypted mismatch or corruption. SQLCipher has no decrypt specific
   * code and overloads NOTADB (26), occasionally CORRUPT (11).
   */
  private static UNREADABLE_ERROR =
    /not a database|file is encrypted|malformed|disk image is malformed|SQLite (?:error )?code:?\s*(?:26|11)\b|NOTADB|SQLITE_CORRUPT/i;

  static getDbVersion = () => SqliteClient.dbVersion;
  // Force a specific db version. This is mainly useful for testsuit.
  static setDbVersion = (version: number) => (SqliteClient.dbVersion = version);

  /**
   * Records and re-throws. Deliberately does not write to the console: the error is
   * thrown, so logging it here would duplicate whatever the caller's error boundary
   * reports - and in dev React already logs every boundary-caught error, which is what
   * LogBox turns red.
   */
  private static recordError = (e: SqliteClientError) => {
    SqliteClient.logger?.('error', e.message, { tag: e.code });

    throw e;
  };

  /**
   * Resolves the encryption key without opening the database, so callers can decide
   * whether to attach an `OfflineDB` at all. Parts of the client write through
   * `client.offlineDb` without checking that it initialized (`queryChannels` upserts
   * into it), so attaching one we cannot open turns those writes into rejections.
   *
   * Throws {@link SqliteClientError}. The key is handed to the next
   * {@link openDB} rather than read from `getEncryptionKey` twice.
   */
  static preflightEncryption = async () => {
    try {
      SqliteClient.preflightedKey = await SqliteClient.resolveEncryptionKey();
    } catch (e) {
      if (e instanceof SqliteClientError) {
        SqliteClient.recordError(e);
      }
      throw e;
    }
  };

  /**
   * The key to open with, or `undefined` when the database is meant to be
   * unencrypted. Throws rather than silently falling back to an unencrypted
   * database, which would hand an integration that asked for encryption a plaintext
   * cache of its users' messages.
   */
  private static resolveEncryptionKey = async () => {
    const { getEncryptionKey } = SqliteClient;

    if (!getEncryptionKey) {
      return undefined;
    }

    // A non-SQLCipher build accepts `encryptionKey` at the JSI boundary and then
    // drops it - plaintext database, no error anywhere. `isSQLCipher` has existed
    // since op-sqlite 9, well below the peer floor, so the typeof check is not really
    // necessary but we'll keep it in case something changes in the future so that
    // we at least have a clearer error.
    if (sqlite === undefined) {
      throw new SqliteClientError(
        'SQLCIPHER_BUILD_MISSING',
        'An offline database encryption key was provided but "@op-engineering/op-sqlite" ' +
          'is not installed.',
      );
    }
    if (typeof sqlite.isSQLCipher !== 'function' || !sqlite.isSQLCipher()) {
      throw new SqliteClientError(
        'SQLCIPHER_BUILD_MISSING',
        'An offline database encryption key was provided but @op-engineering/op-sqlite was ' +
          'not built with SQLCipher, so the key would be silently ignored and the offline ' +
          'database written in plaintext. Add { "op-sqlite": { "sqlcipher": true } } to your ' +
          "application's package.json and rebuild, or stop providing a key.",
      );
    }

    let encryptionKey: string | undefined;

    try {
      encryptionKey = await getEncryptionKey();
    } catch (error) {
      throw new SqliteClientError(
        'ENCRYPTION_KEY_UNAVAILABLE',
        'The offline database encryption key getter threw, so the database cannot be opened.',
        { cause: error },
      );
    }

    // Not being handed a key is not the same as being handed the wrong one, so a locked
    // keychain must not cost us a database we can still read later.
    if (!encryptionKey) {
      throw new SqliteClientError(
        'ENCRYPTION_KEY_UNAVAILABLE',
        'The offline database encryption key getter resolved without a key, so the database ' +
          'cannot be opened.',
      );
    }

    return encryptionKey;
  };

  static openDB = async () => {
    try {
      if (sqlite === undefined) {
        throw new Error(
          'Please install "@op-engineering/op-sqlite" package to enable offline support',
        );
      }
      const encryptionKey =
        SqliteClient.preflightedKey ?? (await SqliteClient.resolveEncryptionKey());
      SqliteClient.preflightedKey = undefined;

      SqliteClient.db = sqlite.open({
        location: SqliteClient.dbLocation,
        name: SqliteClient.dbName,
        ...(encryptionKey ? { encryptionKey } : {}),
      });

      // Note: this will not fail on an encryption key mismatch, as we do not read
      // any pages, but rather look at a connection level flag. The first failure
      // is going to be whatever actually reads something, which is going to be
      // the user_version read in initializeDatabase.
      await SqliteClient.db?.execute('PRAGMA foreign_keys = ON', []);
    } catch (e) {
      if (e instanceof SqliteClientError) {
        throw e;
      }
      SqliteClient.logger?.('error', `Error opening database ${SqliteClient.dbName}`, {
        error: e,
      });
      console.error(`Error opening database ${SqliteClient.dbName}: ${e}`);
    }
  };

  static closeDB = () => {
    try {
      if (!SqliteClient.db) {
        throw new Error('DB is not open or initialized.');
      }
      SqliteClient.db.close();
      SqliteClient.db = undefined;
    } catch (e) {
      SqliteClient.logger?.('error', `Error closing database ${SqliteClient.dbName}`, {
        error: e,
      });
      console.error(`Error closing database ${SqliteClient.dbName}: ${e}`);
    }
  };

  static executeSqlBatch = async (queries: PreparedBatchQueries[]) => {
    if (!queries || !queries.length) {
      return;
    }

    try {
      if (!SqliteClient.db) {
        throw new Error('DB is not open or initialized.');
      }
      // This is a workaround to make the executeBatch method work.
      // It expects an empty array as the second argument in the individual queries if nothing present.
      // Discussion - https://discord.com/channels/1301463257722126357/1324262993780932688/1330846910596251711
      const finalQueries = queries.map((query) => {
        if (query.length === 1) {
          // @ts-ignore
          query.push([]);
        }
        return query;
      });
      await SqliteClient.db.executeBatch(finalQueries);
    } catch (e) {
      SqliteClient.logger?.('error', 'SqlBatch queries failed', {
        error: e,
        queries,
      });
      throw new Error(`Queries failed: ${e}`);
    }
  };

  static executeSql = async (query: string, params?: Scalar[]) => {
    try {
      if (!SqliteClient.db) {
        throw new Error('DB is not open or initialized.');
      }
      const { rows } = await SqliteClient.db.execute(query, params);

      return rows ? (rows as Record<string, string>[]) : [];
    } catch (e) {
      SqliteClient.logger?.('error', 'Sql single query failed', {
        error: e,
        query,
      });
      throw new Error(`Query failed: ${e}: `);
    }
  };

  static dropTables = async () => {
    const queries: PreparedQueries[] = Object.keys(tables).map((table) => [
      `DROP TABLE IF EXISTS ${table}`,
      [],
    ]);
    SqliteClient.logger?.('info', 'Dropping tables', {
      tables: Object.keys(tables),
    });
    await SqliteClient.executeSqlBatch(queries);
  };

  static deleteDatabase = () => {
    SqliteClient.logger?.('info', 'deleteDatabase', {
      dbLocation: SqliteClient.dbLocation,
      dbname: SqliteClient.dbName,
    });
    try {
      if (!SqliteClient.db) {
        throw new Error('DB is not open or initialized.');
      }
      SqliteClient.db.delete();
    } catch (e) {
      SqliteClient.logger?.('error', 'Error deleting DB', {
        dbLocation: SqliteClient.dbLocation,
        dbname: SqliteClient.dbName,
        error: e,
      });
      throw new Error(`Error deleting DB: ${e}`);
    }

    return true;
  };

  /**
   * Whether the file cannot be read with the key we have, as opposed to being
   * temporarily unavailable (busy, locked, disk). Works off message text because
   * op-sqlite rejects with a plain Error and this class re-wraps those messages, so
   * no numeric code survives. Drives `OFFLINE_DB_UNREADABLE`.
   */
  static isUnreadableDbError = (e: unknown) => {
    const message = String((e as Error)?.message ?? e);

    if (SqliteClient.TRANSIENT_ERROR.test(message)) {
      return false;
    }

    return SqliteClient.UNREADABLE_ERROR.test(message);
  };

  static initializeDatabase = async (): Promise<boolean> => {
    try {
      await SqliteClient.openDB();
      const version = await SqliteClient.getUserPragmaVersion();

      if (version !== SqliteClient.dbVersion) {
        SqliteClient.logger?.('info', 'DB version mismatch');
        await SqliteClient.dropTables();
        await SqliteClient.updateUserPragmaVersion(SqliteClient.dbVersion);
      }

      SqliteClient.logger?.('info', 'create tables if not exists', {
        tables: Object.keys(tables),
      });
      const q = (Object.keys(tables) as Table[]).reduce<PreparedQueries[]>(
        (queriesSoFar, tableName) => {
          queriesSoFar.push(...createCreateTableQuery(tableName));
          return queriesSoFar;
        },
        [],
      );

      await SqliteClient.executeSqlBatch(q);

      return true;
    } catch (e) {
      if (e instanceof SqliteClientError) {
        SqliteClient.recordError(e);
      }

      if (SqliteClient.isUnreadableDbError(e)) {
        SqliteClient.recordError(
          new SqliteClientError(
            'OFFLINE_DB_UNREADABLE',
            'The offline database exists but could not be read. Usually the encryption ' +
              'key changed, or encryption was turned on or off while a database from ' +
              'the other mode was still on disk. Delete it with ' +
              'SqliteClient.deleteDatabase() and re-mount to rebuild from the server - ' +
              'everything in it is a cache, except queued offline actions, which are lost.',
            { cause: e },
          ),
        );
      }

      console.log('Error initializing DB', e);
      SqliteClient.logger?.('error', 'Error initializing DB', {
        dbLocation: SqliteClient.dbLocation,
        dbname: SqliteClient.dbName,
        error: e,
      });

      return false;
    }
  };

  static updateUserPragmaVersion = async (version: number) => {
    SqliteClient.logger?.('info', `updateUserPragmaVersion to ${version}`);
    if (!SqliteClient.db) {
      throw new Error('DB is not open or initialized.');
    }
    await SqliteClient.db.execute(`PRAGMA user_version = ${version}`, []);
  };

  static getUserPragmaVersion = async () => {
    try {
      if (!SqliteClient.db) {
        throw new Error('DB is not open or initialized.');
      }
      const { rows } = await SqliteClient.db.execute('PRAGMA user_version', []);
      const result = rows ? rows : [];
      SqliteClient.logger?.('info', 'getUserPragmaVersion', {
        result,
      });
      return result[0].user_version as number;
    } catch (e) {
      console.log('Error getting user_version', e);
      throw new Error(`Querying for user_version failed: ${e}`);
    }
  };

  static resetDB = async () => {
    SqliteClient.logger?.('info', 'resetDB');
    if (SqliteClient.db) {
      await SqliteClient.dropTables();
      SqliteClient.closeDB();
    }
    await SqliteClient.initializeDatabase();
  };
}
