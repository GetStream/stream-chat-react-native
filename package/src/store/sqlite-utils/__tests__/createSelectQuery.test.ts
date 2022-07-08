import { createSelectQuery } from '../createSelectQuery';

describe('createSelectQuery', () => {
  it('should build a simple select query', () => {
    const query = createSelectQuery('channels');

    expect(query).toStrictEqual(['SELECT * FROM channels', []]);
  });

  it('should build select query with where clause', () => {
    const query = createSelectQuery('channels', ['cid', 'id'], {
      cid: 'boo',
      id: ['cute', 'foo'],
    });

    expect(query).toStrictEqual([
      'SELECT cid, id FROM channels WHERE cid = ? AND id in (?,?)',
      ['boo', 'cute', 'foo'],
    ]);
  });
});
