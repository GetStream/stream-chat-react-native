import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames, TableColumnValue } from '../types';

export const appendWhereClause = <T extends keyof Schema>(
  selectQuery: string,
  whereCondition?: Partial<{ [k in TableColumnNames<T>]: TableColumnValue | TableColumnValue[] }>,
): PreparedQueries => {
  if (!whereCondition) return [selectQuery, []];

  const whereClause = [];
  const whereParams: TableColumnValue[] = [];

  for (const key in whereCondition) {
    const value = whereCondition[key];
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      const questionMarks = Array(Object.keys(value).length).fill('?').join(',');
      whereClause.push(`${key} in (${questionMarks})`);
      whereParams.push(...value);
    } else {
      whereClause.push(`${key} = ?`);
      whereParams.push(value);
    }
  }

  if (!whereParams.length && !whereClause.length) {
    return [selectQuery, []];
  }

  return [`${selectQuery} WHERE ${whereClause.join(' AND ')}`, whereParams];
};
