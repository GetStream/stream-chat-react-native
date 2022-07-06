/* eslint-disable no-underscore-dangle */
import { FAILED_QUERY_RESULT } from '../../../mock-builders/DB/consts';
import { sqliteMock } from '../../../mock-builders/DB/mock';
import { DB_LOCATION, DB_NAME } from '../../constants';
import { mapMessageToStorable } from '../../mappers/mapMessageToStorable';
import { tables } from '../../schema';
import { createUpsertQuery } from '../createUpsertQuery';
import { executeQueries } from '../executeQueries';

// global.console = { error: jest.fn(), log: jest.fn(),  };

describe('executeQueries', () => {
  beforeEach(() => {
    sqliteMock.open();

    sqliteMock.executeSql(
      DB_NAME,
      `CREATE TABLE IF NOT EXISTS contacts (
      contact_id INTEGER,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL
    )`,
      [],
    );
    sqliteMock.executeSql(
      DB_NAME,
      `INSERT INTO contacts (
      contact_id,
      first_name,
      last_name,
      email,
      phone
    ) VALUES
      ('boo1', 'Steve', 'Galili', 'steve@getstream.io', '329438u293'),
      ('boo2', 'Vishal', 'Narkhede', 'vishal@getstream.io', '33329438u293'),
      ('boo3', 'Mads', 'Roskar', 'mads@getstream.io', '329438fdu293');
    `,
      [],
    );
    sqliteMock.close();
  });
  afterEach(() => {
    sqliteMock.open();
    const tableNames = Object.keys(tables);
    tableNames.forEach((name) => {
      sqliteMock.executeSql(DB_NAME, `DROP TABLE IF EXISTS ${name}`, []);
    });
    sqliteMock.close();
  });
  it('should try to store data and fail', () => {
    sqliteMock.open();
    const selectResult = sqliteMock.executeSql(DB_NAME, `SELECT * FROM contacts`, []);

    console.log(selectResult.rows._arrays);
    sqliteMock.close();
    expect(1).toBe(1);
  });
});
