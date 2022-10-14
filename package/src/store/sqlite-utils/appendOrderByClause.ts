import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames } from '../types';

export const appendOrderByClause = <T extends keyof Schema>(
  selectQuery: string,
  orderBy?: Partial<{ [k in TableColumnNames<T>]: 1 | -1 }>,
): PreparedQueries => {
  if (!orderBy) return [selectQuery, []];

  const orderByClause = [];

  for (const key in orderBy) {
    const order = orderBy[key];
    if (order === undefined) continue;

    orderByClause.push(`${key} ${order === 1 ? 'ASC' : 'DESC'}`);
  }

  if (!orderByClause.length) {
    return [selectQuery, []];
  }

  return [`${selectQuery} ORDER BY ${orderByClause.join(', ')}`];
};
