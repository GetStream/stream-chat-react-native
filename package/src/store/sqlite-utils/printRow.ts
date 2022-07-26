import type { TableRow } from '../types';

export const printRow = (row: TableRow<any>) => {
  const prettyRow: Record<string, any> = {};
  for (const key in row) {
    // @ts-ignore
    const value = row[key];

    try {
      prettyRow[key] = JSON.parse(value);
    } catch (e) {
      prettyRow[key] = value;
    }
  }

  console.log(JSON.stringify(prettyRow, null, 2));
};
