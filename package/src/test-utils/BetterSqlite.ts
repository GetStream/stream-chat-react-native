import Database, { type Database as DatabaseType } from 'better-sqlite3';

import { tables } from '../store/schema';

export class BetterSqlite {
  static db: DatabaseType | null = null;

  static openDB = (): void => {
    BetterSqlite.db = new Database('foobar.db');
  };

  static closeDB = (): void => {
    BetterSqlite.db?.close();
  };

  static getTables = async (): Promise<unknown> => {
    const tablesInDb = await BetterSqlite.db?.pragma('table_list;');
    return tablesInDb;
  };

  static dropAllTables = (): void => {
    const tableNames = Object.keys(tables);

    tableNames.forEach((name) => {
      const stmt = BetterSqlite.db?.prepare(`DROP TABLE IF EXISTS ${name}`);
      stmt?.run();
    });
  };

  static selectFromTable = async <TRow = Record<string, unknown>>(
    table: string,
  ): Promise<TRow[]> => {
    const stmt = await BetterSqlite.db?.prepare(`SELECT * FROM ${table}`);
    const result = (stmt?.all() ?? []) as TRow[];

    return result;
  };
}
