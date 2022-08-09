import Sqlite3 from 'better-sqlite3';

import type { PreparedQueries } from '../../store/types';

export let db: Sqlite3.Database;

export const sqliteMock = {
  close: () => {
    db.close();
    return {
      message: '',
      status: 0,
    };
  },
  executeSql: (dbName: string, queryInput: string, params: unknown[]) => {
    const query = queryInput.trim().toLowerCase();
    const stmt = db.prepare(query);
    let result: unknown[] = [];

    if (query.indexOf('select') === 0) {
      if (params) {
        const modifiedParams = params.map((p) => {
          if (typeof p == 'boolean') {
            return Number(p);
          } else {
            return p;
          }
        });
        result = stmt.all(modifiedParams);
      } else {
        result = stmt.all();
      }

      return {
        message: '',
        rows: {
          _array: result,
        },
        status: 0,
      };
    }

    if (query.indexOf('pragma') === 0) {
      const pragmaQueryTokens = query.split(' ');
      if (pragmaQueryTokens[2] === '=') {
        db.pragma(`${pragmaQueryTokens[1]} = ${pragmaQueryTokens[3]}`);
      } else {
        result = db.pragma(`${pragmaQueryTokens[1]}`);
      }

      return {
        message: '',
        rows: {
          _array: result,
        },
        status: 0,
      };
    }

    // insert or create table query
    if (params) {
      stmt.run(params);
    } else {
      stmt.run();
    }

    return {
      message: '',
      rows: {
        _array: result,
      },
      status: 0,
    };
  },
  executeSqlBatch: (dbName: string, queriesArr: PreparedQueries[]) => {
    queriesArr.forEach((queryAndParams) => {
      const query = queryAndParams[0];
      const params = queryAndParams[1];
      const stmt = db.prepare(query);
      if (params) {
        const modifiedParams = params.map((p) => {
          if (typeof p == 'boolean') {
            return Number(p);
          } else {
            return p;
          }
        });

        stmt.run(modifiedParams);
      } else {
        stmt.run();
      }
    });

    return {
      message: '',
      staus: 0,
    };
  },
  open: () => {
    db = new Sqlite3('foobar.db');
    return {
      message: '',
      status: 0,
    };
  },
};
