/* eslint-disable no-underscore-dangle */
import type { DB, OPSQLite } from '@op-engineering/op-sqlite';
let sqlite: typeof OPSQLite;

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
import type { PreparedQueries, Table } from './types';

/**
 * SqliteClient takes care of any direct interaction with sqlite.
 * This way usage @op-engineering/op-sqlite package is scoped to a single class/file.
 */
export class SqliteClient {
  static dbVersion = 3;

  static dbName = DB_NAME;
  static dbLocation = DB_LOCATION;
  static logger: Logger | undefined;
  static db: DB | undefined;

  static getDbVersion = () => SqliteClient.dbVersion;
  // Force a specific db version. This is mainly useful for testsuit.
  static setDbVersion = (version: number) => (SqliteClient.dbVersion = version);

  static openDB = () => {
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
      this.db.execute(`PRAGMA foreign_keys = ON`, []);
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
    } catch (e) {
      this.logger?.('error', `Error closing database ${SqliteClient.dbName}`, {
        error: e,
      });
      console.error(`Error closing database ${SqliteClient.dbName}: ${e}`);
    }
  };

  static executeSqlBatch = (queries: PreparedQueries[]) => {
    if (!queries || !queries.length) return;

    SqliteClient.openDB();
    try {
      if (!this.db) {
        throw new Error('DB is not open or initialized.');
      }
      this.db.executeBatch(queries);

      SqliteClient.closeDB();
    } catch (e) {
      SqliteClient.closeDB();
      this.logger?.('error', `SqlBatch queries failed`, {
        error: e,
        queries,
      });
      throw new Error(`Queries failed: ${e}`);
    }
  };

  static executeSql = (query: string, params?: string[]) => {
    try {
      SqliteClient.openDB();
      if (!this.db) {
        throw new Error('DB is not open or initialized.');
      }
      const { rows } = this.db.execute(query, params);
      SqliteClient.closeDB();

      return rows ? rows._array : [];
    } catch (e) {
      SqliteClient.closeDB();
      this.logger?.('error', `Sql single query failed`, {
        error: e,
        query,
      });
      throw new Error(`Query failed: ${e}: `);
    }
  };

  static dropTables = () => {
    const queries: PreparedQueries[] = Object.keys(tables).map((table) => [
      `DROP TABLE IF EXISTS ${table}`,
      [],
    ]);
    this.logger?.('info', `Dropping tables`, {
      tables: Object.keys(tables),
    });
    SqliteClient.executeSqlBatch(queries);
  };

  static deleteDatabase = () => {
    this.logger?.('info', `deleteDatabase`, {
      dbLocation: SqliteClient.dbLocation,
      dbname: SqliteClient.dbName,
    });
    try {
      if (!this.db) {
        throw new Error('DB is not open or initialized.');
      }
      this.db.delete();
    } catch (e) {
      this.logger?.('error', `Error deleting DB`, {
        dbLocation: SqliteClient.dbLocation,
        dbname: SqliteClient.dbName,
        error: e,
      });
      throw new Error(`Error deleting DB: ${e}`);
    }

    return true;
  };

  static initializeDatabase = () => {
    SqliteClient.openDB();
    const version = SqliteClient.getUserPragmaVersion();

    if (version !== SqliteClient.dbVersion) {
      SqliteClient.logger?.('info', `DB version mismatch`);
      SqliteClient.dropTables();
      SqliteClient.updateUserPragmaVersion(SqliteClient.dbVersion);
    }
    SqliteClient.logger?.('info', `create tables if not exists`, {
      tables: Object.keys(tables),
    });
    const q = (Object.keys(tables) as Table[]).reduce<PreparedQueries[]>(
      (queriesSoFar, tableName) => {
        queriesSoFar.push(...createCreateTableQuery(tableName));
        return queriesSoFar;
      },
      [],
    );

    SqliteClient.executeSqlBatch(q);
  };

  static updateUserPragmaVersion = (version: number) => {
    SqliteClient.logger?.('info', `updateUserPragmaVersion to ${version}`);
    SqliteClient.openDB();
    if (!this.db) {
      throw new Error('DB is not open or initialized.');
    }
    this.db.execute(`PRAGMA user_version = ${version}`, []);
    SqliteClient.closeDB();
  };

  static getUserPragmaVersion = () => {
    try {
      if (!this.db) {
        throw new Error('DB is not open or initialized.');
      }
      const { rows } = this.db.execute(`PRAGMA user_version`, []);
      const result = rows ? rows._array : [];
      this.logger?.('info', `getUserPragmaVersion`, {
        result,
      });
      SqliteClient.closeDB();
      return result[0].user_version as number;
    } catch (e) {
      SqliteClient.closeDB();
      throw new Error(`Querying for user_version failed: ${e}`);
    }
  };

  static resetDB = () => {
    this.logger?.('info', `resetDB`);
    SqliteClient.dropTables();
    SqliteClient.initializeDatabase();
  };
}
