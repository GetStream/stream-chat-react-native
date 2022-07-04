import { DB_LOCATION, DB_NAME } from '../../constants';
import { executeQueries } from '../executeQueries';
import { createUpsertQuery } from '../createUpsertQuery';
import { mapMessageToStorable } from '../../mappers/mapMessageToStorable';
import { FAILED_QUERY_RESULT } from '../../../mock-builders/DB/consts';
import { sqliteMock } from '../../../mock-builders/DB/mock';

global.console = { error: jest.fn(), log: jest.fn(),  };

describe('executeQueries', () => {
  it('should try to store data and fail', () => {
    sqliteMock.executeSqlBatch = jest.fn(() => FAILED_QUERY_RESULT);
    const queries = createUpsertQuery('messages', mapMessageToStorable({}));
    executeQueries([queries], 'some debug info');

    expect(sqliteMock.open).toHaveBeenCalledWith(DB_NAME, DB_LOCATION);
    expect(sqliteMock.executeSql).toHaveBeenCalledWith(DB_NAME, `PRAGMA foreign_keys = ON`, []);
    expect(console.log).toHaveBeenCalledWith('TIME TAKEN TO STORE: ', 0);
    expect(console.error).toHaveBeenCalledWith(
      `Query/queries failed. some debug info fail ${JSON.stringify(FAILED_QUERY_RESULT)}`,
    );
    expect(sqliteMock.close).toHaveBeenCalledWith(DB_NAME);
  });

});
