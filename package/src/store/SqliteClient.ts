import type { DB, OPSQLiteProxy } from '@op-engineering/op-sqlite';
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

import { Logger } from 'stream-chat';

import { DB_LOCATION, DB_NAME } from './constants';
import { tables } from './schema';
import { createCreateTableQuery } from './sqlite-utils/createCreateTableQuery';
import type { PreparedBatchQueries, PreparedQueries, Scalar, Table } from './types';

/**
 * SqliteClient takes care of any direct interaction with sqlite.
 * This way usage @op-engineering/op-sqlite package is scoped to a single class/file.
 */
export class SqliteClient {
  static dbVersion = 11;

  static dbName = DB_NAME;
  static dbLocation = DB_LOCATION;
  static logger: Logger | undefined;
  static db: DB | undefined;

  static getDbVersion = () => SqliteClient.dbVersion;
  // Force a specific db version. This is mainly useful for testsuit.
  static setDbVersion = (version: number) => (SqliteClient.dbVersion = version);

  static openDB = async () => {
    try {
      if (sqlite === undefined) {
        throw new Error(
          'Please install "@op-engineering/op-sqlite" package to enable offline support',
        );
      }
      this.db = sqlite.open({
        location: SqliteClient.dbLocation,
        name: SqliteClient.dbName,
      });

      await this.db?.execute('PRAGMA foreign_keys = ON', []);
    } catch (e) {
      this.logger?.('error', `Error opening database ${SqliteClient.dbName}`, {
        error: e,
      });
      console.error(`Error opening database ${SqliteClient.dbName}: ${e}`);
    }
  };

  static closeDB = () => {
    try {
      if (!this.db) {
        throw new Error('DB is not open or initialized.');
      }
      this.db.close();
      this.db = undefined;
    } catch (e) {
      this.logger?.('error', `Error closing database ${SqliteClient.dbName}`, {
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
      if (!this.db) {
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
      await this.db.executeBatch(finalQueries);
    } catch (e) {
      this.db?.execute('ROLLBACK');
      this.logger?.('error', 'SqlBatch queries failed', {
        error: e,
        queries,
      });
      throw new Error(`Queries failed: ${e}`);
    }
  };

  static executeSql = async (query: string, params?: Scalar[]) => {
    try {
      if (!this.db) {
        throw new Error('DB is not open or initialized.');
      }
      const { rows } = await this.db.execute(query, params);

      return rows ? (rows as Record<string, string>[]) : [];
    } catch (e) {
      this.logger?.('error', 'Sql single query failed', {
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
    this.logger?.('info', 'Dropping tables', {
      tables: Object.keys(tables),
    });
    await SqliteClient.executeSqlBatch(queries);
  };

  static deleteDatabase = () => {
    this.logger?.('info', 'deleteDatabase', {
      dbLocation: SqliteClient.dbLocation,
      dbname: SqliteClient.dbName,
    });
    try {
      if (!this.db) {
        throw new Error('DB is not open or initialized.');
      }
      this.db.delete();
    } catch (e) {
      this.logger?.('error', 'Error deleting DB', {
        dbLocation: SqliteClient.dbLocation,
        dbname: SqliteClient.dbName,
        error: e,
      });
      throw new Error(`Error deleting DB: ${e}`);
    }

    return true;
  };

  static initializeDatabase = async () => {
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
      console.log('Error initializing DB', e);
      this.logger?.('error', 'Error initializing DB', {
        dbLocation: SqliteClient.dbLocation,
        dbname: SqliteClient.dbName,
        error: e,
      });

      return false;
    }
  };

  static updateUserPragmaVersion = async (version: number) => {
    SqliteClient.logger?.('info', `updateUserPragmaVersion to ${version}`);
    if (!this.db) {
      throw new Error('DB is not open or initialized.');
    }
    await this.db.execute(`PRAGMA user_version = ${version}`, []);
  };

  static getUserPragmaVersion = async () => {
    try {
      if (!this.db) {
        throw new Error('DB is not open or initialized.');
      }
      const { rows } = await this.db.execute('PRAGMA user_version', []);
      const result = rows ? rows : [];
      this.logger?.('info', 'getUserPragmaVersion', {
        result,
      });
      return result[0].user_version as number;
    } catch (e) {
      console.log('Error getting user_version', e);
      throw new Error(`Querying for user_version failed: ${e}`);
    }
  };

  static resetDB = async () => {
    this.logger?.('info', 'resetDB');
    if (this.db) {
      await SqliteClient.dropTables();
      SqliteClient.closeDB();
    }
    await SqliteClient.initializeDatabase();
  };
}
