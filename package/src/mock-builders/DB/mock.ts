import { rmSync } from 'fs';

import Sqlite3 from 'better-sqlite3';

import type { PreparedQueries } from '../../store/types';

let db: Sqlite3.Database;
const testDbName = `foobar-${process.env.JEST_WORKER_ID ?? '0'}.db`;

export const sqliteMock = {
  // better-sqlite3 has no SQLCipher, so an `encryptionKey` passed to open() is
  // simply ignored. Reporting a SQLCipher build keeps the encrypted path
  // exercisable in tests; whether the bytes on disk are actually encrypted can
  // only be verified on a device. Spy on this to test the build-missing guard.
  isSQLCipher: () => true,
  open: () => {
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
      // Mirrors op-sqlite's delete(): closes the handle and unlinks the file, so a
      // subsequent open() starts from an empty database.
      delete: () => {
        db.close();
        rmSync(testDbName, { force: true });
      },
      execute: async (queryInput: string, params: unknown[]) => {
        const query = queryInput.trim();
        // Lower-cased COPY, used only to classify the statement and to parse PRAGMA tokens. The query
        // itself must be executed with its original casing: SQL keywords are case-insensitive, but
        // string literals are not — and `selectMessagesForChannels` builds its result rows with
        // `json_object('extraData', a.extraData, ...)`, whose keys are literals. Lower-casing the whole
        // statement renamed every one of those keys (`extradata`, `createdAt` -> `createdat`, ...), so
        // `mapStorableToMessage`'s destructuring silently produced `undefined` for every camelCase
        // field — including the `extraData` blob that carries `status`. op-sqlite runs the SQL as
        // written, so this only ever misled tests.
        const classifier = query.toLowerCase();

        const stmt = db.prepare(query);
        let result: unknown[] = [];
        if (classifier.indexOf('select') === 0) {
          const modifiedParams = params?.map((p) => (typeof p === 'boolean' ? Number(p) : p)) || [];
          result = await new Promise((resolve) => resolve(stmt.all(modifiedParams)));

          return {
            message: '',
            rows: result,
            status: 0,
          };
        }

        if (classifier.indexOf('pragma') === 0) {
          const pragmaQueryTokens = classifier.split(' ');
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
