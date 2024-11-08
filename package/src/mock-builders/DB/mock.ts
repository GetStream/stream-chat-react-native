import Sqlite3 from 'better-sqlite3';

import type { PreparedQueries } from '../../store/types';

let db: Sqlite3.Database;

export const sqliteMock = {
  open: () => {
    db = new Sqlite3('foobar.db');
    return {
      close: () => {
        db.close();
        return {
          message: '',
          status: 0,
        };
      },
      execute: async (queryInput: string, params: unknown[]) => {
        const query = queryInput.trim().toLowerCase();

        const stmt = db.prepare(query);
        let result: unknown[] = [];
        if (query.indexOf('select') === 0) {
          const modifiedParams = params?.map((p) => (typeof p === 'boolean' ? Number(p) : p)) || [];
          result = await new Promise((resolve) => resolve(stmt.all(modifiedParams)));

          return {
            message: '',
            rows: result,
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
            rows: result,
            status: 0,
          };
        }

        // insert or create table query
        await new Promise((resolve) => {
          if (params) {
            const modifiedParams = params.map((p) => (typeof p === 'boolean' ? Number(p) : p));
            stmt.run(modifiedParams);
          } else {
            stmt.run();
          }
          resolve(undefined);
        });

        return {
          message: '',
          rows: result,
          status: 0,
        };
      },
      executeBatch: async (queriesArr: PreparedQueries[]) => {
        for (const queryAndParams of queriesArr) {
          const query = queryAndParams[0];
          const params = queryAndParams[1];
          const stmt = db.prepare(query);

          await new Promise((resolve) => {
            if (params) {
              const modifiedParams = params.map((p) => (typeof p === 'boolean' ? Number(p) : p));
              stmt.run(modifiedParams);
            } else {
              stmt.run();
            }
            resolve(undefined);
          });
        }

        return {
          message: '',
          staus: 0,
        };
      },
    };
  },
};
