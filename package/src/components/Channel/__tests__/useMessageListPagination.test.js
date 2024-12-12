import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { channelInitialState } from '../hooks/useChannelDataState';
import * as ChannelStateHooks from '../hooks/useChannelDataState';
import { useMessageListPagination } from '../hooks/useMessageListPagination';

describe('useMessageListPagination', () => {
  let chatClient;
  let channel;

  const mockedHook = (state, values) =>
    jest.spyOn(ChannelStateHooks, 'useChannelMessageDataState').mockImplementation(() => ({
      copyMessagesStateFromChannel: jest.fn(),
      jumpToLatestMessage: jest.fn(),
      jumpToMessageFinished: jest.fn(),
      loadInitialMessagesStateFromChannel: jest.fn(),
      loadMoreFinished: jest.fn(),
      loadMoreRecentFinished: jest.fn(),
      setLoading: jest.fn(),
      setLoadingMore: jest.fn(),
      setLoadingMoreRecent: jest.fn(),
      state: { ...channelInitialState, ...state },
      ...values,
    }));

  beforeEach(async () => {
    // Reset all modules before each test
    jest.resetModules();
    const user = generateUser({ id: 'id', name: 'name' });
    chatClient = await getTestClientWithUser(user);

    const mockedChannel = generateChannelResponse({
      messages: Array.from({ length: 10 }, (_, i) => generateMessage({ text: `message-${i}` })),
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
    // Restore all mocks to their original implementation
    jest.restoreAllMocks();
    cleanup();
  });

  it('should set the state when the loadLatestMessages is called', async () => {
    const loadMessageIntoState = jest.fn(() => {
      channel.state.messages = Array.from({ length: 20 }, (_, i) =>
        generateMessage({ text: `message-${i}` }),
      );
      channel.state.messagePagination.hasPrev = true;
    });
    channel.state = {
      ...channelInitialState,
      loadMessageIntoState,
      messagePagination: {
        hasNext: true,
        hasPrev: true,
      },
    };
    const { result } = renderHook(() => useMessageListPagination({ channel }));

    await act(async () => {
      await result.current.loadLatestMessages();
    });

    await waitFor(() => {
      expect(loadMessageIntoState).toHaveBeenCalledTimes(1);
      expect(result.current.state.hasMore).toBe(true);
      expect(result.current.state.messages.length).toBe(20);
    });
  });

  describe('loadMore', () => {
    afterEach(() => {
      // Clear all mocks after each test
      jest.clearAllMocks();
      // Restore all mocks to their original implementation
      jest.restoreAllMocks();
      cleanup();
    });
    it('should not set the state when the loadMore function is called and hasPrev is false', async () => {
      const queryFn = jest.fn();
      channel.state = {
        ...channelInitialState,
        messagePagination: {
          hasNext: true,
          hasPrev: false,
        },
      };
      channel.query = queryFn;
      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalledTimes(0);
      });
    });

    it('should not set the state when the loading more and loading more recent boolean are true', async () => {
      const queryFn = jest.fn();
      channel.state = {
        ...channelInitialState,
        messagePagination: {
          hasNext: true,
          hasPrev: true,
        },
      };
      channel.query = queryFn;

      mockedHook({ loadingMore: true, loadingMoreRecent: true });

      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalledTimes(0);
      });
    });

    it('should set the state when the loadMore function is called and hasPrev is true and loadingMore is false and loadingMoreRecent is false', async () => {
      const messages = Array.from({ length: 20 }, (_, i) =>
        generateMessage({ text: `message-${i}` }),
      );
      const queryFn = jest.fn(() => {
        channel.state.messages = Array.from({ length: 40 }, (_, i) =>
          generateMessage({ text: `message-${i}` }),
        );
        channel.state.messagePagination.hasPrev = true;
      });
      channel.state = {
        ...channelInitialState,
        messagePagination: {
          hasNext: true,
          hasPrev: true,
        },
        messages,
      };
      channel.query = queryFn;

      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadMore();
      });

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalledWith({
          messages: { id_lt: messages[0].id, limit: 20 },
          watchers: { limit: 20 },
        });
        expect(result.current.state.hasMore).toBe(true);
        expect(result.current.state.messages.length).toBe(40);
      });
    });
  });

  describe('loadMoreRecent', () => {
    afterEach(() => {
      // Clear all mocks after each test
      jest.clearAllMocks();
      // Restore all mocks to their original implementation
      jest.restoreAllMocks();
      cleanup();
    });

    it('should not set the state when the loadMoreRecent function is called and hasNext is false', async () => {
      const queryFn = jest.fn();
      channel.state = {
        ...channelInitialState,
        messagePagination: {
          hasNext: false,
          hasPrev: true,
        },
      };
      channel.query = queryFn;
      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadMoreRecent();
      });

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalledTimes(0);
      });
    });

    it('should not set the state when the loading more and loading more recent boolean are true', async () => {
      const queryFn = jest.fn();
      channel.state = {
        ...channelInitialState,
        messagePagination: {
          hasNext: true,
          hasPrev: true,
        },
      };
      channel.query = queryFn;

      mockedHook({ loadingMore: true, loadingMoreRecent: true });

      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadMoreRecent();
      });

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalledTimes(0);
      });
    });

    it('should set the state when the loadMoreRecent function is called and hasNext is true and loadingMore is false and loadingMoreRecent is false', async () => {
      const messages = Array.from({ length: 20 }, (_, i) =>
        generateMessage({ text: `message-${i}` }),
      );
      const queryFn = jest.fn(() => {
        channel.state.messages = Array.from({ length: 40 }, (_, i) =>
          generateMessage({ text: `message-${i}` }),
        );
        channel.state.messagePagination.hasPrev = true;
      });
      channel.state = {
        ...channelInitialState,
        messagePagination: {
          hasNext: true,
          hasPrev: true,
        },
        messages,
      };
      channel.query = queryFn;

      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadMoreRecent();
      });

      await waitFor(() => {
        expect(queryFn).toHaveBeenCalledWith({
          messages: { id_gt: messages[messages.length - 1].id, limit: 10 },
          watchers: { limit: 10 },
        });
        expect(result.current.state.hasMore).toBe(true);
        expect(result.current.state.messages.length).toBe(40);
      });
    });
  });

  describe('loadChannelAroundMessage', () => {
    afterEach(() => {
      // Clear all mocks after each test
      jest.clearAllMocks();
      // Restore all mocks to their original implementation
      jest.restoreAllMocks();
      cleanup();
    });

    it('should not do anything when the messageId to search for is not passed', async () => {
      const loadMessageIntoState = jest.fn(() => {
        channel.state.messages = Array.from({ length: 20 }, (_, i) =>
          generateMessage({ text: `message-${i}` }),
        );
        channel.state.messagePagination.hasPrev = true;
      });
      channel.state = {
        ...channelInitialState,
        loadMessageIntoState,
        messagePagination: {
          hasNext: true,
          hasPrev: true,
        },
      };
      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadChannelAroundMessage({ messageId: undefined });
      });

      await waitFor(() => {
        expect(loadMessageIntoState).toHaveBeenCalledTimes(0);
      });
    });

    it('should call the loadMessageIntoState function when the messageId to search for is passed and set the state', async () => {
      const loadMessageIntoState = jest.fn(() => {
        channel.state.messages = Array.from({ length: 20 }, (_, i) =>
          generateMessage({ text: `message-${i}` }),
        );
        channel.state.messagePagination.hasPrev = true;
      });
      channel.state = {
        ...channelInitialState,
        loadMessageIntoState,
        messagePagination: {
          hasNext: false,
          hasPrev: true,
        },
      };
      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadChannelAroundMessage({ messageId: 'message-5' });
      });

      await waitFor(() => {
        expect(loadMessageIntoState).toHaveBeenCalledTimes(1);
        expect(result.current.state.hasMore).toBe(true);
        expect(result.current.state.hasMoreNewer).toBe(false);
        expect(result.current.state.messages.length).toBe(20);
        expect(result.current.state.targetedMessageId).toBe('message-5');
      });
    });
  });

  describe('loadChannelAtFirstUnreadMessage', () => {
    afterEach(() => {
      // Clear all mocks after each test
      jest.clearAllMocks();
      // Restore all mocks to their original implementation
      jest.restoreAllMocks();
      cleanup();
    });

    it('should not do anything when the unread count is 0', async () => {
      const loadMessageIntoState = jest.fn(() => {
        channel.state.messages = Array.from({ length: 20 }, (_, i) =>
          generateMessage({ text: `message-${i}` }),
        );
        channel.state.messagePagination.hasPrev = true;
      });
      channel.state = {
        ...channelInitialState,
        loadMessageIntoState,
        messagePagination: {
          hasNext: true,
          hasPrev: true,
        },
      };

      channel.countUnread = jest.fn(() => 0);

      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadChannelAtFirstUnreadMessage({});
      });

      await waitFor(() => {
        expect(loadMessageIntoState).toHaveBeenCalledTimes(0);
      });
    });

    function getElementsAround(array, key, id, limit) {
      const index = array.findIndex((obj) => obj[key] === id);

      if (index === -1) {
        return [];
      }

      const start = Math.max(0, index - limit); // 12 before the index
      const end = Math.min(array.length, index + limit); // 12 after the index
      return array.slice(start, end);
    }

    it('should call the loadMessageIntoState function when the unread count is greater than 0 and set the state', async () => {
      const messages = Array.from({ length: 30 }, (_, i) =>
        generateMessage({ text: `message-${i}` }),
      );
      const loadMessageIntoState = jest.fn((messageId) => {
        channel.state.messages = getElementsAround(messages, 'id', messageId, 5);
        channel.state.messagePagination.hasPrev = true;
      });
      channel.state = {
        ...channelInitialState,
        loadMessageIntoState,
        messagePagination: {
          hasNext: false,
          hasPrev: true,
        },
        messages,
        messageSets: [{ isCurrent: true, isLatest: true }],
      };

      const unreadCount = 5;
      channel.countUnread = jest.fn(() => unreadCount);

      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadChannelAtFirstUnreadMessage({});
      });

      await waitFor(() => {
        expect(loadMessageIntoState).toHaveBeenCalledTimes(1);
        expect(result.current.state.hasMore).toBe(true);
        expect(result.current.state.hasMoreNewer).toBe(false);
        expect(result.current.state.messages.length).toBe(10);
        expect(result.current.state.targetedMessageId).toBe(
          messages[messages.length - unreadCount].id,
        );
      });
    });
  });
});
