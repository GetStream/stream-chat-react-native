import { createSelectQuery } from '../createSelectQuery';

describe('createSelectQuery', () => {
  it('should build a simple select query', () => {
    const query = createSelectQuery('channels');

    expect(query).toStrictEqual(['SELECT * FROM channels', []]);
  });

  it('should build select query with where clause', () => {
    const query = createSelectQuery('channels', ['cid', 'id'], {
      cid: 'messaging:1nj32k341nkn23',
      id: ['123', '456'],
    });

    expect(query).toStrictEqual([
      'SELECT cid, id FROM channels WHERE cid = ? AND id in (?,?)',
      ['messaging:1nj32k341nkn23', '123', '456'],
    ]);
  });
});
