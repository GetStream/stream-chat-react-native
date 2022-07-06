import Database from 'better-sqlite3';

import { SUCCESSFUL_QUERY_RESULT } from './consts';

import type { PreparedQueries } from '../../store/types';

export let db: Database;

export const sqliteMock = {
  close: () => {
    db.close();
    return {
      message: '',
      status: 0,
    };
  },
  executeSql: (dbName: string, queryInput: string, params: string[]) => {
    const query = queryInput.trim().toLowerCase();
    const stmt = db.prepare(query);
    let result = [];

    if (query.indexOf('select') === 0) {
      if (params) {
        result = stmt.all(params);
      } else {
        result = stmt.all();
      }

      return {
        message: '',
        rows: {
          _arrays: result,
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
        _arrays: result,
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
        stmt.run(params);
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
    db = new Database('foobar.db');
    return {
      message: '',
      status: 0,
    };
  },
};

export const initializeDBMocking = () => {
  global.sqlite = sqliteMock;
};
export const resetDBMocking = () => (global.sqlite = undefined);
