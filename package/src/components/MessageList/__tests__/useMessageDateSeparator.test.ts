import { renderHook } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import { useMessageDateSeparator } from '../hooks/useMessageDateSeparator';
import { useMessageGroupStyles } from '../hooks/useMessageGroupStyles';

describe('useMessageDateSeparator', () => {
  let messages: LocalMessage[];

  beforeEach(() => {
    messages = [
      {
        created_at: new Date('2020-01-01T00:00:00.000Z'),
        id: '1',
        text: 'Hello',
      },
      {
        created_at: new Date('2020-01-02T00:00:00.000Z'),
        id: '2',
        text: 'World',
      },
      {
        created_at: new Date('2020-01-03T00:00:00.000Z'),
        id: '3',
        text: 'Hello World',
      },
    ] as LocalMessage[];
  });

  it('should return undefined if no message is passed', () => {
    const { result } = renderHook(() => useMessageDateSeparator({ message: undefined }));
    expect(result.current).toBeUndefined();
  });

  it('should return undefined if the hideDateSeparators prop is true', () => {
    const { result } = renderHook(() =>
      useMessageDateSeparator({
        hideDateSeparators: true,
        message: messages[1],
        previousMessage: messages[0],
      }),
    );
    expect(result.current).toBeUndefined();
  });

  it('should return the date separator for a message if previous message is not the same day', () => {
    const { result } = renderHook(() =>
      useMessageDateSeparator({ message: messages[1], previousMessage: messages[0] }),
    );
    expect(result.current).toBe(messages[1].created_at);
  });

  it('should return undefined if the message is the same day as the previous message', () => {
    const messages = [
      {
        created_at: new Date('2020-01-01T01:00:00.000Z'),
        id: '1',
        text: 'Hello',
      },
      {
        created_at: new Date('2020-01-01T02:00:00.000Z'),
        id: '2',
        text: 'World',
      },
    ] as LocalMessage[];
    const { result: resultOfFirstMessage } = renderHook(() =>
      useMessageDateSeparator({ message: messages[0], previousMessage: undefined }),
    );
    expect(resultOfFirstMessage.current).toBe(messages[0].created_at);
    const { result: resultOfSecondMessage } = renderHook(() =>
      useMessageDateSeparator({ message: messages[1], previousMessage: messages[0] }),
    );
    expect(resultOfSecondMessage.current).toBeUndefined();
  });

  it('returns the date separator when there is no previous regular message', () => {
    // A system message at the top of the loaded history is skipped by the caller, so the first
    // regular message is handed `undefined` and must be treated as the start of history.
    const { result } = renderHook(() =>
      useMessageDateSeparator({ message: messages[0], previousMessage: undefined }),
    );
    expect(result.current).toBe(messages[0].created_at);
  });

  it('returns the date separator when the previous regular message is on an earlier day', () => {
    // Two system messages sit between these in the list; the caller skips them, so the hook sees
    // the regular message from the day before and still separates the day.
    const { result } = renderHook(() =>
      useMessageDateSeparator({ message: messages[2], previousMessage: messages[0] }),
    );
    expect(result.current).toBe(messages[2].created_at);
  });

  it('returns undefined when the previous regular message is on the same day', () => {
    // The mid-day case: a system message between two regular messages of the same day must not
    // produce a second separator for that day.
    const sameDayMessages = [
      {
        created_at: new Date('2020-01-01T09:00:00.000Z'),
        id: '1',
        text: 'morning',
      },
      {
        created_at: new Date('2020-01-01T15:00:00.000Z'),
        id: '3',
        text: 'afternoon',
      },
    ] as LocalMessage[];

    const { result } = renderHook(() =>
      useMessageDateSeparator({
        message: sameDayMessages[1],
        previousMessage: sameDayMessages[0],
      }),
    );
    expect(result.current).toBeUndefined();
  });

  describe('calendar day comparison', () => {
    const separatorFor = (message: Date, previousMessage: Date) =>
      renderHook(() =>
        useMessageDateSeparator({
          message: { created_at: message } as LocalMessage,
          previousMessage: { created_at: previousMessage } as LocalMessage,
        }),
      ).result.current;

    it('does not separate two times on the same day', () => {
      expect(
        separatorFor(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 1, 0, 1)),
      ).toBeUndefined();
    });

    it('separates across midnight', () => {
      const message = new Date(2026, 0, 2, 0, 1);
      expect(separatorFor(message, new Date(2026, 0, 1, 23, 59))).toBe(message);
    });

    it('separates the same day number in a different month', () => {
      const message = new Date(2026, 1, 1, 10, 0);
      expect(separatorFor(message, new Date(2026, 0, 1, 10, 0))).toBe(message);
    });

    it('separates the same day and month in a different year', () => {
      const message = new Date(2027, 0, 1, 10, 0);
      expect(separatorFor(message, new Date(2026, 0, 1, 10, 0))).toBe(message);
    });

    it('separates across a month boundary', () => {
      const message = new Date(2026, 1, 1, 0, 0);
      expect(separatorFor(message, new Date(2026, 0, 31, 23, 0))).toBe(message);
    });
  });
});

describe('useMessageGroupStyles public contract', () => {
  const user = { id: 'u1' };
  const at = (day: number, hour: number) => new Date(Date.UTC(2026, 0, day, hour, 0, 0));
  const msg = (day: number, hour: number, id: string) =>
    ({ created_at: at(day, hour), id, user }) as LocalMessage;

  it('derives the next message separator itself when the caller omits it', () => {
    // an external caller passing only messages must keep getting develop's behaviour: the group
    // closes because the next message starts a new day
    const message = msg(1, 10, 'a');
    const nextMessage = msg(2, 10, 'b');

    const { result } = renderHook(() =>
      useMessageGroupStyles({
        getMessageGroupStyle: undefined,
        message,
        nextMessage,
        previousMessage: undefined,
      }),
    );

    expect(result.current).toEqual(['single']);
  });

  it('uses the supplied value when the key is present, even if undefined', () => {
    // the message list passes a resolved answer; `undefined` means "no separator there"
    const message = msg(1, 10, 'a');
    const nextMessage = msg(1, 11, 'b');

    const { result } = renderHook(() =>
      useMessageGroupStyles({
        getMessageGroupStyle: undefined,
        message,
        nextMessage,
        nextMessageDateSeparatorDate: undefined,
        previousMessage: undefined,
      }),
    );

    // same user, same day, no separator either side -> the group stays open at the bottom
    expect(result.current).toEqual(['top']);
  });
});
