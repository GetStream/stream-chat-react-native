import Database from 'better-sqlite3';

import { tables } from '../store/schema';

export class BetterSqlite {
  db = null;

  static openDB = () => {
    this.db = new Database('foobar.db');
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
