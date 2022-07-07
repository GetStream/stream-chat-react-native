import { QuickSqliteClient } from './QuickSqliteClient';
import { tables } from './schema';
import { printRow } from './sqlite-utils/printRow';
import type { Table } from './types';

import { isTestEnvironment } from '../contexts/utils/isTestEnvironment';

if (__DEV__ && !isTestEnvironment()) {
  const DevMenu = require('react-native-dev-menu');

  DevMenu.addItem('Reset Stream Offline DB', () => {
    QuickSqliteClient.resetDB();
  });
  setTimeout(() => {
    (Object.keys(tables) as Table[]).forEach((tName) => {
      DevMenu.addItem(`Log ${tName}`, () => {
        const rows = select(`${tName}`, '*');
        rows.forEach((r) => printRow(r));
      });
    });
  }, 100);
}

const select = (table: Table, fields = '*') => {
  const result = QuickSqliteClient.executeSql(`SELECT ${fields} FROM ${table};`, []);

  return result;
};
