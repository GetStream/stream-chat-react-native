import { appendWhereClause } from './appendWhereCluase';

import type { Schema } from '../schema';
import type { PreparedQueries, TableColumns } from '../types';

export const createSelectQuery = <T extends keyof Schema>(
  table: T,
  fields: Array<'*'> | Array<Partial<TableColumns<T>>> = ['*'],
  whereCondition?: Partial<{ [k in TableColumns<T>]: any }>,
) => {
  const selectQuery = `SELECT ${fields.join(', ')} FROM ${table}`;
  const [selectQueryWithWhere, whereParams] = appendWhereClause(selectQuery, whereCondition);

  return [`${selectQueryWithWhere}`, whereParams] as PreparedQueries;
};
