import type { TableRow } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const printRow = (row: TableRow<any>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
