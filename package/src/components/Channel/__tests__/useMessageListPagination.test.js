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
      const messages = Array.from({ length: 20 }, (_, i) =>
        generateMessage({ text: `message-${i}` }),
      );
      const loadMessageIntoState = jest.fn(() => {
        channel.state.messages = messages;
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

      const user = generateUser();
      const channelUnreadState = {
        unread_messages: 0,
        user,
      };

      const jumpToMessageFinishedMock = jest.fn();
      mockedHook(channelInitialState, { jumpToMessageFinished: jumpToMessageFinishedMock });

      const { result } = renderHook(() => useMessageListPagination({ channel }));

      await act(async () => {
        await result.current.loadChannelAtFirstUnreadMessage({ channelUnreadState });
      });

      await waitFor(() => {
        expect(jumpToMessageFinishedMock).toHaveBeenCalledTimes(0);
      });
    });

    const generateMessageArray = (length = 20) =>
      Array.from({ length }, (_, i) => generateMessage({ id: i, text: `message-${i}` }));

    // Test cases with different scenarios
    const testCases = [
      {
        channelUnreadState: (messages) => ({
          first_unread_message_id: messages[2].id,
          unread_messages: 2,
        }),
        expectedCalls: {
          jumpToMessageFinishedCalls: 1,
          loadMessageIntoStateCalls: 0,
          setChannelUnreadStateCalls: 0,
          setTargetedMessageIdCalls: 1,
          targetedMessageId: (messages) => messages[2].id,
        },
        initialMessages: generateMessageArray(),
        name: 'first_unread_message_id present in current message set',
        setupLoadMessageIntoState: null,
      },
      {
        channelUnreadState: () => ({
          first_unread_message_id: 21,
          unread_messages: 2,
        }),
        expectedCalls: {
          jumpToMessageFinishedCalls: 1,
          loadMessageIntoStateCalls: 1,
          setChannelUnreadStateCalls: 0,
          setTargetedMessageIdCalls: 1,
          targetedMessageId: () => 21,
        },
        initialMessages: generateMessageArray(),
        name: 'first_unread_message_id not present in current message set',
        setupLoadMessageIntoState: (channel) => {
          const loadMessageIntoState = jest.fn(() => {
            const newMessages = Array.from({ length: 20 }, (_, i) =>
              generateMessage({ id: i + 21, text: `message-${i + 21}` }),
            );
            channel.state.messages = newMessages;
            channel.state.messagePagination.hasPrev = true;
          });
          channel.state.loadMessageIntoState = loadMessageIntoState;
          return loadMessageIntoState;
        },
      },
      {
        channelUnreadState: (messages) => ({
          last_read_message_id: messages[2].id,
          unread_messages: 2,
        }),
        expectedCalls: {
          jumpToMessageFinishedCalls: 1,
          loadMessageIntoStateCalls: 0,
          setChannelUnreadStateCalls: 1,
          setTargetedMessageIdCalls: 1,
          targetedMessageId: (messages) => messages[3].id,
        },
        initialMessages: generateMessageArray(),
        name: 'last_read_message_id present in current message set',
        setupLoadMessageIntoState: null,
      },
      {
        channelUnreadState: () => ({
          last_read_message_id: 21,
          unread_messages: 2,
        }),
        expectedCalls: {
          jumpToMessageFinishedCalls: 1,
          loadMessageIntoStateCalls: 1,
          setChannelUnreadStateCalls: 1,
          setTargetedMessageIdCalls: 1,
          targetedMessageId: () => 22,
        },
        initialMessages: generateMessageArray(),
        name: 'last_read_message_id not present in current message set',
        setupLoadMessageIntoState: (channel) => {
          const loadMessageIntoState = jest.fn(() => {
            const newMessages = Array.from({ length: 20 }, (_, i) =>
              generateMessage({ id: i + 21, text: `message-${i + 21}` }),
            );
            channel.state.messages = newMessages;
            channel.state.messagePagination.hasPrev = true;
          });
          channel.state.loadMessageIntoState = loadMessageIntoState;
          return loadMessageIntoState;
        },
      },
    ];

    it.each(testCases)('$name', async (testCase) => {
      // Setup channel state
      const messages = testCase.initialMessages;
      channel.state = {
        ...channelInitialState,
        messagePagination: {
          hasNext: true,
          hasPrev: true,
        },
        messages,
      };

      // Setup additional mocks if needed
      const loadMessageIntoStateMock = testCase.setupLoadMessageIntoState
        ? testCase.setupLoadMessageIntoState(channel)
        : null;

      // Generate user and channel unread state
      const user = generateUser();
      const channelUnreadState = {
        user,
        ...testCase.channelUnreadState(messages),
      };

      // Setup mocks
      const jumpToMessageFinishedMock = jest.fn();
      mockedHook(channelInitialState, { jumpToMessageFinished: jumpToMessageFinishedMock });

      const { result } = renderHook(() => useMessageListPagination({ channel }));

      const setChannelUnreadStateMock = jest.fn();
      const setTargetedMessageIdMock = jest.fn((message) => message);

      // Execute the method
      await act(async () => {
        await result.current.loadChannelAtFirstUnreadMessage({
          channelUnreadState,
          setChannelUnreadState: setChannelUnreadStateMock,
          setTargetedMessage: setTargetedMessageIdMock,
        });
      });

      // Verify expectations
      await waitFor(() => {
        if (loadMessageIntoStateMock) {
          expect(loadMessageIntoStateMock).toHaveBeenCalledTimes(
            testCase.expectedCalls.loadMessageIntoStateCalls,
          );
        }

        expect(jumpToMessageFinishedMock).toHaveBeenCalledTimes(
          testCase.expectedCalls.jumpToMessageFinishedCalls,
        );

        expect(setChannelUnreadStateMock).toHaveBeenCalledTimes(
          testCase.expectedCalls.setChannelUnreadStateCalls,
        );

        expect(setTargetedMessageIdMock).toHaveBeenCalledTimes(
          testCase.expectedCalls.setTargetedMessageIdCalls,
        );

        if (testCase.expectedCalls.targetedMessageId) {
          const expectedMessageId = testCase.expectedCalls.targetedMessageId(messages);
          expect(setTargetedMessageIdMock).toHaveBeenCalledWith(expectedMessageId);
        }
      });
    });

    const messages = Array.from({ length: 20 }, (_, i) =>
      generateMessage({
        created_at: new Date('2021-09-01T00:00:00.000Z'),
        id: i,
        text: `message-${i}`,
      }),
    );

    const user = generateUser();

    it.each`
      scenario                                       | last_read                               | expectedQueryCalls | expectedJumpToMessageFinishedCalls | expectedSetChannelUnreadStateCalls | expectedSetTargetedMessageCalls | expectedTargetedMessageId
      ${'when last_read matches a message'}          | ${new Date(messages[10].created_at)}    | ${0}               | ${1}                               | ${1}                               | ${1}                            | ${10}
      ${'when last_read does not match any message'} | ${new Date('2021-09-02T00:00:00.000Z')} | ${1}               | ${0}                               | ${0}                               | ${0}                            | ${undefined}
    `(
      '$scenario',
      async ({
        expectedJumpToMessageFinishedCalls,
        expectedQueryCalls,
        expectedSetChannelUnreadStateCalls,
        expectedSetTargetedMessageCalls,
        expectedTargetedMessageId,
        last_read,
      }) => {
        // Set up channel state
        channel.state = {
          ...channelInitialState,
          messagePagination: {
            hasNext: true,
            hasPrev: true,
          },
          messages,
        };

        const channelUnreadState = {
          last_read,
          unread_messages: 2,
          user,
        };

        // Mock query if needed
        const queryMock = jest.fn();
        channel.query = queryMock;

        // Set up mocks
        const jumpToMessageFinishedMock = jest.fn();
        mockedHook(channelInitialState, { jumpToMessageFinished: jumpToMessageFinishedMock });
        const setChannelUnreadStateMock = jest.fn();
        const setTargetedMessageIdMock = jest.fn((message) => message);

        // Render hook
        const { result } = renderHook(() => useMessageListPagination({ channel }));

        // Act
        await act(async () => {
          await result.current.loadChannelAtFirstUnreadMessage({
            channelUnreadState,
            setChannelUnreadState: setChannelUnreadStateMock,
            setTargetedMessage: setTargetedMessageIdMock,
          });
        });

        // Assert
        await waitFor(() => {
          expect(queryMock).toHaveBeenCalledTimes(expectedQueryCalls);
          expect(jumpToMessageFinishedMock).toHaveBeenCalledTimes(
            expectedJumpToMessageFinishedCalls,
          );
          expect(setChannelUnreadStateMock).toHaveBeenCalledTimes(
            expectedSetChannelUnreadStateCalls,
          );
          expect(setTargetedMessageIdMock).toHaveBeenCalledTimes(expectedSetTargetedMessageCalls);

          if (expectedTargetedMessageId !== undefined) {
            expect(setTargetedMessageIdMock).toHaveBeenCalledWith(expectedTargetedMessageId);
          }
        });
      },
    );
  });
});
