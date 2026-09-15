import React, { PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import { ChannelProvider } from '../../../contexts/channelContext/ChannelContext';
import { MessagesProvider } from '../../../contexts/messagesContext/MessagesContext';
import { useDateSeparatorDates } from '../hooks/useDateSeparatorDates';

const at = (day: number) => new Date(Date.UTC(2026, 0, day, 10, 0, 0));
const message = (id: string, day: number) => ({ created_at: at(day), id }) as LocalMessage;

// newest first, as `MessageList` renders it
const MESSAGES = [message('m2', 2), message('m1', 1)];

const wrapper =
  (channelValue: object, messagesValue: object) =>
  ({ children }: PropsWithChildren) => (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <ChannelProvider value={channelValue as any}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <MessagesProvider value={messagesValue as any}>{children}</MessagesProvider>
    </ChannelProvider>
  );

describe('useDateSeparatorDates', () => {
  it('resolves nothing without an override, so the list never walks the messages', () => {
    const { result } = renderHook(() => useDateSeparatorDates(MESSAGES, true), {
      wrapper: wrapper({}, {}),
    });

    // undefined is the signal that rows derive their own separator from previousMessage
    expect(result.current).toBeUndefined();
  });

  it('resolves every row when an override is supplied', () => {
    const getDateSeparators = jest.fn(({ messages }: { messages: LocalMessage[] }) => ({
      [messages[0].id]: messages[0].created_at,
    }));

    const { result } = renderHook(() => useDateSeparatorDates(MESSAGES, true), {
      wrapper: wrapper({}, { getDateSeparators }),
    });

    expect(getDateSeparators).toHaveBeenCalledTimes(1);
    // the override is handed the list oldest first
    expect(getDateSeparators.mock.calls[0][0].messages.map((m: LocalMessage) => m.id)).toEqual([
      'm1',
      'm2',
    ]);
    // ...and the result is mapped back into render order
    expect(result.current).toEqual([undefined, MESSAGES[1].created_at]);
  });

  it('forwards hideDateSeparators to the override', () => {
    const getDateSeparators = jest.fn(() => ({}));

    renderHook(() => useDateSeparatorDates(MESSAGES, true), {
      wrapper: wrapper({ hideDateSeparators: true }, { getDateSeparators }),
    });

    expect(getDateSeparators).toHaveBeenCalledWith(
      expect.objectContaining({ hideDateSeparators: true }),
    );
  });
});
