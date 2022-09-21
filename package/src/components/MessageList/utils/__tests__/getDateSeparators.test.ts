import type { PaginatedMessageListContextValue } from '../../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { getDateSeparators } from '../getDateSeparators';

describe('getDateSeparators', () => {
  it('should return an empty object if no messages are passed', () => {
    expect(getDateSeparators({ messages: [] })).toEqual({});
  });

  it('should return a date separator for each message in a new day', () => {
    const firstDate = new Date('2020-01-01T00:00:00.000Z');
    const secondDate = new Date('2020-01-02T00:00:00.000Z');
    const messages = [
      {
        created_at: firstDate,
        id: '1',
        text: 'foo',
      },
      {
        created_at: secondDate,
        id: '2',
        text: 'bar',
      },
      {
        created_at: secondDate,
        id: '3',
        text: 'baz',
      },
    ] as PaginatedMessageListContextValue['messages'];

    expect(getDateSeparators({ messages })).toEqual({
      1: firstDate,
      2: secondDate,
    });
  });

  it('should return a date separator for the visible message in a day if deleted messages are not visible to the user', () => {
    const firstDate = new Date('2020-01-01T00:00:00.000Z');
    const secondDate = new Date('2020-01-02T00:00:00.000Z');

    const messages = [
      {
        created_at: firstDate,
        id: '1',
        text: 'foo',
        type: 'regular',
      },
      {
        created_at: secondDate,
        id: '2',
        text: 'bar',
        type: 'deleted',
      },
      {
        created_at: secondDate,
        id: '3',
        text: 'baz',
        type: 'regular',
      },
    ] as PaginatedMessageListContextValue['messages'];

    expect(getDateSeparators({ deletedMessagesVisibilityType: 'never', messages })).toEqual({
      1: firstDate,
      3: secondDate,
    });

    expect(getDateSeparators({ deletedMessagesVisibilityType: 'receiver', messages })).toEqual({
      1: firstDate,
      3: secondDate,
    });
  });
});
