/* eslint-disable no-underscore-dangle */
import type { QuickSQLite } from 'react-native-quick-sqlite';
let sqlite: typeof QuickSQLite;

try {
  sqlite = require('react-native-quick-sqlite').QuickSQLite;
} catch (e) {
  // Failed for one of the reason
  // 1. Running on expo, where we don't support offline storage yet.
  // 2. Offline support is disabled, in which case this library is not installed.
}

import { DB_LOCATION, DB_NAME } from './constants';
import { tables } from './schema';
import { createCreateTableQuery } from './sqlite-utils/createCreateTableQuery';
import type { PreparedQueries, Table } from './types';

/**
 * QuickSqliteClient takes care of any direct interaction with sqlite.
 * This way usage react-native-quick-sqlite package is scoped to a single class/file.
 */
export class QuickSqliteClient {
  static dbVersion = 3;

  static dbName = DB_NAME;
  static dbLocation = DB_LOCATION;

  static getDbVersion = () => this.dbVersion;
  // Force a specific db version. This is mainly useful for testsuit.
  static setDbVersion = (version: number) => (this.dbVersion = version);

  static openDB = () => {
    try {
      sqlite.open(this.dbName, this.dbLocation);
      sqlite.execute(this.dbName, `PRAGMA foreign_keys = ON`, []);
    } catch (e) {
      console.error(`Error opening database ${this.dbName}: ${e}`);
    }
  };

  static closeDB = () => {
    try {
      sqlite.close(this.dbName);
    } catch (e) {
      console.error(`Error closing database ${this.dbName}: ${e}`);
    }
  };

  static executeSqlBatch = (queries: PreparedQueries[]) => {
    if (!queries || !queries.length) return;
    this.openDB();

    try {
      sqlite.executeBatch(DB_NAME, queries);
      this.closeDB();
    } catch (e) {
      this.closeDB();
      throw new Error(`Query/queries failed: ${e}`);
    }
  };

  static executeSql = (query: string, params?: string[]) => {
    this.openDB();

    try {
      const { rows } = sqlite.execute(DB_NAME, query, params);
      this.closeDB();

      return rows ? rows._array : [];
    } catch (e) {
      this.closeDB();
      throw new Error(`Query/queries failed: ${e}: `);
    }
  };

  static dropTables = () => {
    const queries: PreparedQueries[] = Object.keys(tables).map((table) => [
      `DROP TABLE IF EXISTS ${table}`,
      [],
    ]);

    this.executeSqlBatch(queries);
  };

  static deleteDatabase = () => {
    try {
      sqlite.delete(this.dbName, this.dbLocation);
    } catch (e) {
      throw new Error(`Error deleting DB: ${e}`);
    }

    return true;
  };

  static initializeDatabase = () => {
    // @ts-ignore
    if (sqlite === undefined) {
      throw new Error(
        'Please install "react-native-quick-sqlite" package to enable offline support',
      );
    }

    const version = this.getUserPragmaVersion();

    if (version !== this.dbVersion) {
      this.dropTables();
      this.updateUserPragmaVersion(this.dbVersion);
    }
    const q = (Object.keys(tables) as Table[]).reduce<PreparedQueries[]>(
      (queriesSoFar, tableName) => {
        queriesSoFar.push(...createCreateTableQuery(tableName));
        return queriesSoFar;
      },
      [],
    );

    this.executeSqlBatch(q);
  };

  static updateUserPragmaVersion = (version: number) => {
    this.openDB();

    sqlite.execute(DB_NAME, `PRAGMA user_version = ${version}`, []);

    this.closeDB();
  };

  static getUserPragmaVersion = () => {
    this.openDB();

    try {
      const { rows } = sqlite.execute(DB_NAME, `PRAGMA user_version`, []);
      const result = rows ? rows._array : [];
      this.closeDB();
      return result[0].user_version as number;
    } catch (e) {
      this.closeDB();
      throw new Error(`Querying for user_version failed: ${e}`);
    }
  };

  static resetDB = () => {
    this.dropTables();
    this.initializeDatabase();
  };
}
