import type { StorableDatabaseRow } from '../types';

function isJson(str: string) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export const printRow = (row: StorableDatabaseRow) => {
  const prettyRow = {};
  for (const key in row) {
    // @ts-ignore
    const value = row[key];

    if (isJson(value)) {
      // @ts-ignore
      prettyRow[key] = JSON.parse(value);
    } else {
      // @ts-ignore
      prettyRow[key] = value;
    }
  }

  console.log(JSON.stringify(prettyRow, null, 2));
};
