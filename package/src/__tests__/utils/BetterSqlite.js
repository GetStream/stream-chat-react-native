import Database from 'better-sqlite3';

import { tables } from '../../store/schema';

export class BetterSqlite {
  db = null;

  static openDB = () => {
    this.db = new Database('foobar.db');
  };

  static closeDB = () => {
    this.db.close();
  };

  static getTables = () => {
    this.openDB();
    const tablesInDb = this.db.pragma(`table_list;`);
    this.closeDB();

    return tablesInDb;
  };

  static dropAllTables = () => {
    this.openDB();
    const tableNames = Object.keys(tables);

    tableNames.forEach((name) => {
      const stmt = this.db.prepare(`DROP TABLE IF EXISTS ${name}`);
      stmt.run();
    });

    this.closeDB();
  };

  static selectFromTable = (table) => {
    this.openDB();
    const stmt = this.db.prepare(`SELECT * FROM ${table}`);
    const result = stmt.all();
    this.closeDB();

    return result;
  };
}
