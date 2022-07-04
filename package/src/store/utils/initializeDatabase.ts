import { closeDB } from './closeDB';
import { dropTables } from './dropTables';
import { executeQueries } from './executeQueries';

import { openDB } from './openDB';

import { DB_NAME, DB_VERSION } from '../constants';
import { tables } from '../schema';
import type { PreparedQueries, Table } from '../types';

const createCreateTableQuery = (tableName: Table): PreparedQueries[] => {
  const columnsWithDescriptors = Object.entries(tables[tableName].columns).map((entry) => {
    const [key, value] = entry;
    return `${key} ${value}`;
  });

  const primaryKeyConstraints =
    tables[tableName].primaryKey.length > 0
      ? [`PRIMARY KEY (${tables[tableName].primaryKey.join(', ')})`]
      : [];
  const foreignKeysConstraints =
    tables[tableName].foreignKeys?.map(
      (k) =>
        `FOREIGN KEY (${k.column}) REFERENCES ${k.referenceTable}(${
          k.referenceTableColumn
        }) ON DELETE ${k.onDeleteAction || 'NO ACTION'}`,
    ) || [];

  const indexQueries: PreparedQueries[] =
    tables[tableName].indexes?.map((index) => [
      `CREATE ${index.unique ? 'UNIQUE' : ''} INDEX IF NOT EXISTS ${
        index.name
      } ON ${tableName}(${index.columns.join(',')})`,
    ]) || [];

  // console.log([
  //   [
  //     `CREATE TABLE IF NOT EXISTS ${tableName}(
  //         ${[...columnsWithDescriptors, ...primaryKeyConstraints, ...foreignKeysConstraints].join(
  //           ',\n',
  //         )}
  //       );`,
  //   ],
  //   ...indexQueries,
  // ]);
  return [
    [
      `CREATE TABLE IF NOT EXISTS ${tableName}(
        ${[...columnsWithDescriptors, ...primaryKeyConstraints, ...foreignKeysConstraints].join(
          ',\n',
        )}
      );`,
    ],
    ...indexQueries,
  ];
};

const testQuery = () => {
  openDB();

  sqlite.executeSql(DB_NAME, `PRAGMA foreign_keys = ON`, []);
  const { message, rows, status } = sqlite.executeSql(DB_NAME, `PRAGMA foreign_keys`, []);
  if (status === 1) {
    console.error(`Querying for channels failed: ${message}`);
  }

  const result = rows ? rows._array : [];
  console.log('first connection', result);
  closeDB();
};

export const initializeDatabase = () => {
  if (__DEV__) {
    // testQuery();
  }

  const version = getUserPragmaVersion();
  if (version < DB_VERSION) {
    console.log(
      `Dropping the table since version ${version} is less than DB_VERSION ${DB_VERSION}`,
    );
    dropTables();
    updateUserPragmaVersion(DB_VERSION);
  }
  const q = (Object.keys(tables) as Table[]).reduce<PreparedQueries[]>(
    (queriesSoFar, tableName) => {
      queriesSoFar.push(...createCreateTableQuery(tableName));
      return queriesSoFar;
    },
    [],
  );

  executeQueries(q);
};

export const updateUserPragmaVersion = (version: number) => {
  openDB();

  sqlite.executeSql(DB_NAME, `PRAGMA user_version = ${version}`, []);

  closeDB();
};

export const getUserPragmaVersion = () => {
  openDB();

  const { message, rows, status } = sqlite.executeSql(DB_NAME, `PRAGMA user_version`, []);

  closeDB();
  if (status === 1) {
    console.error(`Querying for user_version failed: ${message}`);
  }

  // eslint-disable-next-line no-underscore-dangle
  const result = rows ? rows._array : [];

  return result[0].user_version as number;
};
