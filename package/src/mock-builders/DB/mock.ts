import { SUCCESSFUL_QUERY_RESULT } from './consts';

export const sqliteMock = {
  close: jest.fn(() => SUCCESSFUL_QUERY_RESULT),
  executeSql: jest.fn(),
  executeSqlBatch: jest.fn(() => SUCCESSFUL_QUERY_RESULT),
  open: jest.fn(() => SUCCESSFUL_QUERY_RESULT),
};

export const initializeDBMocking = () => {
  global.sqlite = sqliteMock;
};
export const resetDBMocking = () => global.sqlite = undefined;
