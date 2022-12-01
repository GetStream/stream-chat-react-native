// We are going to disable type checks for this file, since this QuickSqliteClient is for legacy version of sqlite but
// dev-dependency "react-native-quick-sqlite" is not available for legacy version of sqlite.
/* eslint-disable no-underscore-dangle */
// @ts-nocheck

import type { QuickSQLite } from 'react-native-quick-sqlite';
let sqlite: typeof QuickSQLite;

try {
  sqlite = require('react-native-quick-sqlite').QuickSQLite;
} catch (e) {
  // Failed for one of the reason
  // 1. Running on expo, where we don't support offline storage yet.
  // 2. Offline support is disabled, in which case this library is not installed.
}
import { DB_LOCATION, DB_NAME, DB_STATUS_ERROR } from './constants';
import type { PreparedQueries } from './types';

// QuickSqliteClient takes care of any direct interaction with sqlite for v4 of react-native-quick-sqlite.
// This is to avoid any breaking changes for users using v4 of react-native-quick-sqlite.
export class QuickSqliteClient_v4 {
  static dbName = DB_NAME;
  static dbLocation = DB_LOCATION;

  static openDB = () => {
    const { message, status } = sqlite.open(this.dbName, this.dbLocation);
    sqlite.executeSql(this.dbName, `PRAGMA foreign_keys = ON`, []);

    if (status === DB_STATUS_ERROR) {
      console.error(`Error opening database ${this.dbName}: ${message}`);
    }
  };

  static closeDB = () => {
    const { message, status } = sqlite.close(this.dbName);

    if (status === DB_STATUS_ERROR) {
      console.error(`Error closing database ${this.dbName}: ${message}`);
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

  static deleteDatabase = () => {
    const { message, status } = sqlite.delete(this.dbName, this.dbLocation);
    if (status === DB_STATUS_ERROR) {
      throw new Error(`Error deleting DB: ${message}`);
    }

    return true;
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
}
