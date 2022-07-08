import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumnNames } from '../types';

export const createSelectQuery = <T extends keyof Schema>(
  table: T,
  fields: Array<'*'> | Array<TableColumnNames<T>> = ['*'],
  whereCondition?: Partial<{ [k in TableColumnNames<T>]: any }>,
) => {
  const selectQuery = `SELECT ${fields.join(', ')} FROM ${table}`;
  const [selectQueryWithWhere, whereParams] = appendWhereClause(selectQuery, whereCondition);

  return [`${selectQueryWithWhere}`, whereParams] as PreparedQueries;
};
