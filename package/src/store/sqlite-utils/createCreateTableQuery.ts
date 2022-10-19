import { tables } from '../schema';
import type { PreparedQueries, Table } from '../types';

export const createCreateTableQuery = (tableName: Table): PreparedQueries[] => {
  const columnsWithDescriptors = Object.entries(tables[tableName].columns).map((entry) => {
    const [key, value] = entry;
    return `${key} ${value}`;
  });

  const primaryKeyConstraints =
    (tables[tableName].primaryKey || []).length > 0
      ? [`PRIMARY KEY (${(tables[tableName].primaryKey || []).join(', ')})`]
      : [];
  const foreignKeysConstraints =
    tables[tableName].foreignKeys?.map(
      (k) =>
        `FOREIGN KEY (${k.column}) REFERENCES ${k.referenceTable}(${
          k.referenceTableColumn
        }) ON DELETE ${k.onDeleteAction || 'NO ACTION'}`,
    ) || [];

  const indexQueries: PreparedQueries[] =
    tables[tableName].indexes?.map((index) => [
      `CREATE ${index.unique ? 'UNIQUE' : ''} INDEX IF NOT EXISTS ${
        index.name
      } ON ${tableName}(${index.columns.join(',')})`,
    ]) || [];

  return [
    [
      `CREATE TABLE IF NOT EXISTS ${tableName}(
          ${[...columnsWithDescriptors, ...primaryKeyConstraints, ...foreignKeysConstraints].join(
            ',\n',
          )}
        );`,
    ],
    ...indexQueries,
  ];
};
