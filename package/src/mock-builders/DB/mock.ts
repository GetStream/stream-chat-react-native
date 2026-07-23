import Sqlite3 from 'better-sqlite3';

import type { PreparedQueries } from '../../store/types';

let db: Sqlite3.Database;
const testDbName = `foobar-${process.env.JEST_WORKER_ID ?? '0'}.db`;

// DIAGNOSTIC: trace the offline-DB table lifecycle so we can correlate when tables are actually
// created against the "no such table" errors. Timestamps are absolute ms — eyeball the deltas
// between "open"/"CREATE TABLE ..." and the failing queries. Remove once understood.
const logDb = (message: string) => {
  console.log(`[DB-MOCK t=${Date.now()} w=${process.env.JEST_WORKER_ID ?? '0'}] ${message}`);
};

const logIfCreateTable = (rawQuery: string, via: string) => {
  const table = /create\s+table(?:\s+if\s+not\s+exists)?\s+["'`]?(\w+)/i.exec(rawQuery)?.[1];
  if (table) {
    logDb(`CREATE TABLE ${table} (${via})`);
  }
};

export const sqliteMock = {
  open: () => {
    logDb('open()');
    db = new Sqlite3(testDbName);
    db.pragma('journal_mode = MEMORY');
    db.pragma('synchronous = OFF');
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
        logIfCreateTable(query, 'execute');

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
            result = db.pragma(`${pragmaQueryTokens[1]}`) as unknown[];
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
          logIfCreateTable(query, 'executeBatch');
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
