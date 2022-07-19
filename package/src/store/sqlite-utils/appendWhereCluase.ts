import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames } from '../types';

export const appendWhereClause = <T extends keyof Schema>(
  selectQuery: string,
  whereCondition?: Partial<{ [k in TableColumnNames<T>]: any }>,
) => {
  if (!whereCondition) return [selectQuery, []];

  const whereClause = [];
  const whereParams: unknown[] = [];

  for (const key in whereCondition) {
    const value: unknown = whereCondition[key];
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      const questionMarks = Array(Object.keys(value).length).fill('?').join(',');
      whereClause.push(`${key} in (${questionMarks})`);
      whereParams.push(...value);
    } else {
      whereClause.push(`${key} = ?`);
      whereParams.push(value);
    }
  }

  if (!whereParams.length) {
    return [selectQuery, []];
  }

  return [`${selectQuery} WHERE ${whereClause.join(' AND ')}`, whereParams] as PreparedQueries;
};
