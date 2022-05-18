import { closeDB } from './closeDB';
import { openDB } from './openDB';
import { printRow } from './printRow';
import { resetDatabase } from './resetDatabase';

import { DB_NAME } from '../constants';
import { schema } from '../schema';
import type { Table } from '../types';

if (__DEV__) {
  const DevMenu = require('react-native-dev-menu');

  DevMenu.addItem('Reset Stream Offline DB', resetDatabase);
  setTimeout(() => {
    DevMenu.addItem('User Pragma Version', userPragmaVersion);
    (Object.keys(schema) as Table[]).forEach((tName) => {
      DevMenu.addItem(`Log ${tName}`, () => {
        const rows = select(`${tName}`, '*');
        rows.forEach((r) => printRow(r));
      });
    });
  }, 100);
}

const userPragmaVersion = (table: Table, fields = '*') => {
  openDB();

  const { message, rows, status } = sqlite.executeSql(DB_NAME, `PRAGMA user_version`, []);

  closeDB();
  if (status === 1) {
    console.error(`Querying for ${table} failed: ${message}`);
  }

  // eslint-disable-next-line no-underscore-dangle
  const result = rows ? rows._array : [];
  console.log({
    result
  })
};

const select = (table: Table, fields = '*') => {
  openDB();

  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT ${fields} FROM ${table};`,
    [],
  );

  closeDB();
  if (status === 1) {
    console.error(`Querying for ${table} failed: ${message}`);
  }

  // eslint-disable-next-line no-underscore-dangle
  return rows ? rows._array : [];
};
