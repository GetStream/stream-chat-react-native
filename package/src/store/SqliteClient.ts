import type { _InternalDB, OPSQLiteProxy } from '@op-engineering/op-sqlite';
let sqlite: OPSQLiteProxy;

try {
  sqlite = require('@op-engineering/op-sqlite');
} catch (e) {
  // Rethrow when a remote debugger (e.g. Chrome) is attached: SQLite needs synchronous JSI calls.
  const isRemoteDebuggerError = e instanceof Error && e.message.includes('Failed to install');
  if (isRemoteDebuggerError) {
    throw e;
  }
  // op-sqlite is not installed (regular Expo, which has no offline storage, or offline support is
  // disabled), so `sqlite` stays undefined.
}

import type { Sink } from 'stream-chat';

import { DB_LOCATION, DB_NAME } from './constants';
import { tables } from './schema';
import { createCreateTableQuery } from './sqlite-utils/createCreateTableQuery';
import type { PreparedBatchQueries, PreparedQueries, Scalar, Table } from './types';

/**
 * Why the offline database could not be opened. The first two only occur when
 * {@link SqliteClient.getEncryptionKey} is set; `OFFLINE_DB_UNREADABLE` can also mean corruption or
 * a database left over from the other encryption mode.
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
    // Assigned directly because Hermes does not reliably honor the `ErrorOptions` overload.
    this.cause = options?.cause;
  }
}

/** Wraps all direct use of `@op-engineering/op-sqlite`. */
export class SqliteClient {
  static dbVersion = 18;

  static dbName = DB_NAME;
  static dbLocation = DB_LOCATION;
  static logger: Sink | undefined;
  static db: _InternalDB | undefined;

  /**
   * Supplies the SQLCipher key the offline database opens with. Defaults to `undefined`, which
   * opens it unencrypted. The key must stay the same for the life of the database file (there is no
   * rekey): a database this key cannot read raises `OFFLINE_DB_UNREADABLE` and is left untouched.
   * Recover with `SqliteClient.deleteDatabase()` and a re-mount.
   */
  static getEncryptionKey: (() => Promise<string | undefined>) | undefined;

  /** Key resolved by {@link preflightEncryption}, consumed by the next {@link openDB}. */
  private static preflightedKey: string | undefined;

  /** Transient failures (busy, disk, memory). Checked first so they never read as unreadable. */
  private static TRANSIENT_ERROR =
    /database is locked|SQLITE_BUSY|SQLITE_LOCKED|disk i\/o|SQLITE_IOERR|unable to open|SQLITE_CANTOPEN|out of memory|readonly/i;

  /**
   * The file cannot be read with the current key: wrong or rotated key, an encrypted/plaintext
   * mismatch, or corruption. SQLCipher has no decrypt-specific code, so it overloads NOTADB (26)
   * and occasionally CORRUPT (11).
   */
  private static UNREADABLE_ERROR =
    /not a database|file is encrypted|malformed|disk image is malformed|SQLite (?:error )?code:?\s*(?:26|11)\b|NOTADB|SQLITE_CORRUPT/i;

  static getDbVersion = () => SqliteClient.dbVersion;
  // Overrides the DB version, mainly for tests.
  static setDbVersion = (version: number) => (SqliteClient.dbVersion = version);

  /** Logs the error to the logger and re-throws it, without writing to the console. */
  private static recordError = (e: SqliteClientError) => {
    SqliteClient.logger?.('error', e.message, { tag: e.code });

    throw e;
  };

  /**
   * Resolves the encryption key without opening the database, so callers can decide whether to
   * attach an `OfflineDB` at all: the client writes through `client.offlineDb` (for example in
   * `queryChannels`) without checking it initialized, so one that cannot open rejects those writes.
   * The next {@link openDB} reuses the key and does not call `getEncryptionKey` again.
   *
   * @throws {SqliteClientError} When the key cannot be resolved.
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
   * The key to open with, or `undefined` when the database is meant to be unencrypted. Throws when
   * encryption was requested but is unavailable, and never falls back to an unencrypted database.
   */
  private static resolveEncryptionKey = async () => {
    const { getEncryptionKey } = SqliteClient;

    if (!getEncryptionKey) {
      return undefined;
    }

    // A non-SQLCipher build accepts `encryptionKey` and silently drops it, writing a plaintext
    // database. The `typeof` check is defensive, for a clearer error if `isSQLCipher` is missing.
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

    // A missing key is not a wrong key: throwing leaves the database untouched, so a locked
    // keychain does not cost a database that is readable later.
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

      // Does not fail on an encryption key mismatch because no pages are read here. The first
      // failure comes from the first real read: the `user_version` read in `initializeDatabase`.
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
      // `executeBatch` expects an empty params array in queries that have none.
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
   * Whether the file cannot be read with the current key, as opposed to being temporarily
   * unavailable (busy, locked, disk). Matches on the message text because op-sqlite rejects with a
   * plain `Error` and this class re-wraps it, so no numeric code survives. Drives
   * `OFFLINE_DB_UNREADABLE`.
   *
   * @param e The error thrown while opening or reading the database.
   * @returns True when the database is unreadable rather than temporarily unavailable.
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
