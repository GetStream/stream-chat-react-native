/* eslint-disable no-underscore-dangle */
import type { QuickSQLite } from 'react-native-quick-sqlite';
let sqlite: typeof QuickSQLite;

try {
  sqlite = require('react-native-quick-sqlite').QuickSQLite;
} catch (e) {
  // We want to throw the original error when remote debugger (e.g. Chrome) is enabled.
  // QuickSQLite can only be used when synchronous method invocations (JSI) are possible.
  // e.g on-device debugger (e.g. Flipper).
  const isRemoteDebuggerError = e instanceof Error && e.message.includes('Failed to install');
  if (isRemoteDebuggerError) {
    throw e;
  }
  // Reaching here will mean that QuickSQLite is not installed for one of the reasons
  // 1. Running on regular expo, where we don't support offline storage yet.
  // 2. Offline support is disabled, in which case this library is not installed.
}

import { DB_LOCATION, DB_NAME } from './constants';
import { tables } from './schema';
import { createCreateTableQuery } from './sqlite-utils/createCreateTableQuery';
import type { PreparedQueries, Table } from './types';

/**
 * QuickSqliteClient takes care of any direct interaction with sqlite.
 * This way usage react-native-quick-sqlite package is scoped to a single class/file.
 *
 */
export class QuickSqliteClient {
  static dbVersion = 3;

  static dbName = DB_NAME;
  static dbLocation = DB_LOCATION;

  static getDbVersion = () => QuickSqliteClient.dbVersion;
  // Force a specific db version. This is mainly useful for testsuit.
  static setDbVersion = (version: number) => (QuickSqliteClient.dbVersion = version);

  static openDB = () => {
    try {
      sqlite.open(QuickSqliteClient.dbName, QuickSqliteClient.dbLocation);
      sqlite.execute(QuickSqliteClient.dbName, `PRAGMA foreign_keys = ON`, []);
    } catch (e) {
      console.error(`Error opening database ${QuickSqliteClient.dbName}: ${e}`);
    }
  };

  static closeDB = () => {
    try {
      sqlite.close(QuickSqliteClient.dbName);
    } catch (e) {
      console.error(`Error closing database ${QuickSqliteClient.dbName}: ${e}`);
    }
  };

  static executeSqlBatch = (queries: PreparedQueries[]) => {
    if (!queries || !queries.length) return;

    QuickSqliteClient.openDB();
    try {
      sqlite.executeBatch(DB_NAME, queries);

      QuickSqliteClient.closeDB();
    } catch (e) {
      QuickSqliteClient.closeDB();
      throw new Error(`Query/queries failed: ${e}`);
    }
  };

  static executeSql = (query: string, params?: string[]) => {
    try {
      QuickSqliteClient.openDB();
      const { rows } = sqlite.execute(DB_NAME, query, params);
      QuickSqliteClient.closeDB();

      return rows ? rows._array : [];
    } catch (e) {
      QuickSqliteClient.closeDB();
      throw new Error(`Query/queries failed: ${e}: `);
    }
  };

  static dropTables = () => {
    const queries: PreparedQueries[] = Object.keys(tables).map((table) => [
      `DROP TABLE IF EXISTS ${table}`,
      [],
    ]);

    QuickSqliteClient.executeSqlBatch(queries);
  };

  static deleteDatabase = () => {
    try {
      sqlite.delete(QuickSqliteClient.dbName, QuickSqliteClient.dbLocation);
    } catch (e) {
      throw new Error(`Error deleting DB: ${e}`);
    }

    return true;
  };

  static initializeDatabase = () => {
    if (sqlite === undefined) {
      throw new Error(
        'Please install "react-native-quick-sqlite" package to enable offline support',
      );
    }

    const version = QuickSqliteClient.getUserPragmaVersion();

    if (version !== QuickSqliteClient.dbVersion) {
      QuickSqliteClient.dropTables();
      QuickSqliteClient.updateUserPragmaVersion(QuickSqliteClient.dbVersion);
    }
    const q = (Object.keys(tables) as Table[]).reduce<PreparedQueries[]>(
      (queriesSoFar, tableName) => {
        queriesSoFar.push(...createCreateTableQuery(tableName));
        return queriesSoFar;
      },
      [],
    );

    QuickSqliteClient.executeSqlBatch(q);
  };

  static updateUserPragmaVersion = (version: number) => {
    QuickSqliteClient.openDB();
    sqlite.execute(DB_NAME, `PRAGMA user_version = ${version}`, []);
    QuickSqliteClient.closeDB();
  };

  static getUserPragmaVersion = () => {
    QuickSqliteClient.openDB();
    try {
      const { rows } = sqlite.execute(DB_NAME, `PRAGMA user_version`, []);
      const result = rows ? rows._array : [];
      QuickSqliteClient.closeDB();
      return result[0].user_version as number;
    } catch (e) {
      QuickSqliteClient.closeDB();
      throw new Error(`Querying for user_version failed: ${e}`);
    }
  };

  static resetDB = () => {
    QuickSqliteClient.dropTables();
    QuickSqliteClient.initializeDatabase();
  };
}
