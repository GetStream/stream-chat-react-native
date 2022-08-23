import type { Schema } from './schema';

export type Table = keyof Schema;
export type TableRow<T extends Table> = Schema[T];
export type TableRowJoinedUser<T extends Table> = Schema[T] & {
  user: TableRow<'users'>;
};

export type TableColumnNames<T extends Table> = keyof Schema[T];
export type TableColumnValue = string | boolean | number | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PreparedQueries = [string] | [string, Array<any>];
