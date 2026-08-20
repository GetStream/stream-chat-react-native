import Database from 'better-sqlite3';

import { tables } from '../store/schema';

// Must match the name used by mock-builders/DB/mock.ts.
const testDbName = `foobar-${process.env.JEST_WORKER_ID ?? '0'}.db`;

export class BetterSqlite {
  db = null;

  static openDB = () => {
    this.db = new Database(testDbName);
  };

  static closeDB = () => {
    this.db.close();
  };

  static getTables = async () => {
    const tablesInDb = await this.db.pragma('table_list;');
    return tablesInDb;
  };

  static dropAllTables = () => {
    const tableNames = Object.keys(tables);

    tableNames.forEach((name) => {
      const stmt = this.db.prepare(`DROP TABLE IF EXISTS ${name}`);
      stmt.run();
    });
  };

  static selectFromTable = async (table) => {
    const stmt = await this.db.prepare(`SELECT * FROM ${table}`);
    const result = stmt.all();

    return result;
  };
}
