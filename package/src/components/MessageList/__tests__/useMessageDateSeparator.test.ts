import { renderHook } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import { MessagePreviousAndNextMessageStore } from '../../../state-store/message-list-prev-next-state';
import { useMessageDateSeparator } from '../hooks/useMessageDateSeparator';

describe('useMessageDateSeparator', () => {
  let messageListPreviousAndNextMessageStore: MessagePreviousAndNextMessageStore;
  let messages: LocalMessage[];

  beforeEach(() => {
    messageListPreviousAndNextMessageStore = new MessagePreviousAndNextMessageStore();
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
    messageListPreviousAndNextMessageStore.setMessageListPreviousAndNextMessage({ messages });
  });

  it('should return undefined if no message is passed', () => {
    const { result } = renderHook(() =>
      useMessageDateSeparator({ message: undefined, messageListPreviousAndNextMessageStore }),
    );
    expect(result.current).toBeUndefined();
  });

  it('should return undefined if the hideDateSeparators prop is true', () => {
    const { result } = renderHook(() =>
      useMessageDateSeparator({
        hideDateSeparators: true,
        message: messages[1],
        messageListPreviousAndNextMessageStore,
      }),
    );
    expect(result.current).toBeUndefined();
  });

  it('should return the date separator for a message if previous message is not the same day', () => {
    const { result } = renderHook(() =>
      useMessageDateSeparator({ message: messages[1], messageListPreviousAndNextMessageStore }),
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
    const messageListPreviousAndNextMessageStore = new MessagePreviousAndNextMessageStore();
    messageListPreviousAndNextMessageStore.setMessageListPreviousAndNextMessage({ messages });
    const { result: resultOfFirstMessage } = renderHook(() =>
      useMessageDateSeparator({ message: messages[0], messageListPreviousAndNextMessageStore }),
    );
    expect(resultOfFirstMessage.current).toBe(messages[0].created_at);
    const { result: resultOfSecondMessage } = renderHook(() =>
      useMessageDateSeparator({ message: messages[1], messageListPreviousAndNextMessageStore }),
    );
    expect(resultOfSecondMessage.current).toBeUndefined();
  });
});
