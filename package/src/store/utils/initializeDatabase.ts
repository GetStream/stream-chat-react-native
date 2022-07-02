import { closeDB } from './closeDB';
import { dropTables } from './dropTables';
import { executeQueries } from './executeQueries';

import { openDB } from './openDB';

import { printRow } from './printRow';

import { DB_NAME, DB_VERSION } from '../constants';
import { schema } from '../schema';
import type { Table } from '../types';

const createCreateTableQuery = (table: Table) => {
  const columnsWithDescriptors = Object.entries(schema[table]).map((entry) => {
    const [key, value] = entry;
    return `${key} ${value}`;
  });

  return `CREATE TABLE IF NOT EXISTS ${table}(
  ${columnsWithDescriptors.join(',\n')}
  );`;
};
const testQuery = () => {
  openDB();
  const timeStart = new Date().getTime();
  const messagesColumnNames = Object.keys(schema.messages)
    .map((name) => `'${name}', a.${name}`)
    .join(', ');
  const userColumnNames = Object.keys(schema.users)
    .map((name) => `'${name}', b.${name}`)
    .join(', ');

  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT
      json_object(
        'user', json_object(
          ${userColumnNames}
        ),
        ${messagesColumnNames}
      ) as value
    FROM (
      SELECT
        *,
        ROW_NUMBER() OVER (
          PARTITION BY cid
          ORDER BY datetime(createdAt) DESC
        ) RowNum
      FROM messages
    ) a
    LEFT JOIN
      users b
    ON b.id = a.userId 
    WHERE RowNum < 2
    LIMIT 1`,
    [],
  );
  const timeEnd = new Date().getTime();

  // const timeStart1 = new Date().getTime();
  // sqlite.executeSql(DB_NAME, `SELECT * FROM messages LIMIT 1`, []);
  // sqlite.executeSql(DB_NAME, `SELECT * FROM users LIMIT 1`, []);

  // const timeEnd1 = new Date().getTime();

  console.log('Time for join - ', timeEnd - timeStart);
  // console.log('Time without join - ', timeEnd1 - timeStart1);
  if (status === 1) {
    console.error(`Querying for channels failed: ${message}`);
  }

  const result = rows ? rows._array : [];
  result.forEach(r => printRow(JSON.parse(r.value)))
  closeDB();
};

export const initializeDatabase = () => {
  // testQuery();
  const version = getUserPragmaVersion();
  if (version < DB_VERSION) {
    console.log(
      `Dropping the table since version ${version} is less than DB_VERSION ${DB_VERSION}`,
    );
    dropTables();
    updateUserPragmaVersion(version + 1);
  }

  executeQueries(
    (Object.keys(schema) as Table[]).map((tableName) => [createCreateTableQuery(tableName)]),
  );
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
