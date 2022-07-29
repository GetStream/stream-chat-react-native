/* eslint-disable no-underscore-dangle */
// Importing following package just to avoid errors using sqlite global.
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
import types from 'react-native-quick-sqlite';

try {
  require('react-native-quick-sqlite');
} catch (e) {
  // Failed for one of the reason
  // 1. Running on expo, where we don't support offline storage yet.
  // 2. Offline support is disabled, in which case this library is not installed.
}

import { DB_LOCATION, DB_NAME, DB_STATUS_ERROR } from './constants';
import { tables } from './schema';
import { createCreateTableQuery } from './sqlite-utils/createCreateTableQuery';
import type { PreparedQueries, Table } from './types';

export class QuickSqliteClient {
  static dbVersion = 0;

  static dbName = DB_NAME;
  static dbLocation = DB_LOCATION;

  static getDbVersion = () => this.dbVersion;
  static setDbVersion = (version: number) => (this.dbVersion = version);

  static openDB = () => {
    const { message, status } = sqlite.open(this.dbName, this.dbLocation);
    sqlite.executeSql(this.dbName, `PRAGMA foreign_keys = ON`, []);

    if (status === DB_STATUS_ERROR) {
      console.error(`Error opening database ${this.dbName}: ${message}`);
    }
  };

  static closeDB = () => {
    const { message, status } = sqlite.open(this.dbName, this.dbLocation);

    if (status === DB_STATUS_ERROR) {
      console.error(`Error opening database ${this.dbName}: ${message}`);
    }
  };

  static executeSqlBatch = (queries: PreparedQueries[]) => {
    this.openDB();

    const res = sqlite.executeSqlBatch(DB_NAME, queries);

    if (res.status === 1) {
      console.error(`Query/queries failed: ${res.message} ${JSON.stringify(res)}`);
    }

    this.closeDB();
  };

  static executeSql = (query: string, params?: string[]) => {
    this.openDB();

    const { message, rows, status } = sqlite.executeSql(DB_NAME, query, params);

    this.closeDB();

    if (status === 1) {
      console.error(`Query/queries failed: ${message}: `, query);
    }

    return rows ? rows._array : [];
  };

  static dropTables = () => {
    const queries: PreparedQueries[] = Object.keys(tables).map((table) => [
      `DROP TABLE IF EXISTS ${table}`,
      [],
    ]);

    this.executeSqlBatch(queries);
  };

  static deleteDatabase = () => {
    const { message, status } = sqlite.delete(this.dbName, this.dbLocation);
    if (status === DB_STATUS_ERROR) {
      throw new Error(`Error deleting DB: ${message}`);
    }

    return true;
  };

  static initializeDatabase = () => {
    // @ts-ignore
    if (window.sqlite === undefined) {
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

    sqlite.executeSql(DB_NAME, `PRAGMA user_version = ${version}`, []);

    this.closeDB();
  };

  static getUserPragmaVersion = () => {
    this.openDB();

    const { message, rows, status } = sqlite.executeSql(DB_NAME, `PRAGMA user_version`, []);

    this.closeDB();
    if (status === 1) {
      console.error(`Querying for user_version failed: ${message}`);
    }

    const result = rows ? rows._array : [];
    return result[0].user_version as number;
  };

  static resetDB = () => {
    this.dropTables();
    this.initializeDatabase();
  };
}
