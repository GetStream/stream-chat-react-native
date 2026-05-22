import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import { ChannelProvider } from '../../../../contexts/channelContext/ChannelContext';
import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { NotificationTargetProvider } from '../../../Notifications/NotificationTargetContext';
import { useMessageActionHandlers } from '../useMessageActionHandlers';

const createClient = () =>
  ({
    mutedUsers: [],
    notifications: {
      add: jest.fn(() => 'notification-id'),
      remove: jest.fn(),
      startTimeout: jest.fn(),
    },
    on: jest.fn(() => ({ unsubscribe: jest.fn() })),
    pinMessage: jest.fn(),
    unpinMessage: jest.fn(),
    userID: 'current-user-id',
  }) as unknown as StreamChat & {
    notifications: { add: jest.Mock; remove: jest.Mock; startTimeout: jest.Mock };
    pinMessage: jest.Mock;
    unpinMessage: jest.Mock;
  };

const createChannel = () =>
  ({
    markUnread: jest.fn(),
  }) as unknown as Channel & { markUnread: jest.Mock };

const createWrapper =
  (client: StreamChat, channel: Channel) =>
  ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client } as never}>
      <NotificationTargetProvider hostId='channel:messaging:general' panel='channel'>
        <ChannelProvider value={{ channel } as never}>{children}</ChannelProvider>
      </NotificationTargetProvider>
    </ChatProvider>
  );

const createMessage = (overrides?: Partial<LocalMessage>) =>
  ({
    id: 'message-id',
    pinned: false,
    text: 'Message text',
    user: { id: 'message-user-id', name: 'Message User' },
    ...overrides,
  }) as LocalMessage;

const renderUseMessageActionHandlers = ({
  channel = createChannel(),
  client = createClient(),
  message = createMessage(),
}: {
  channel?: Channel & { markUnread: jest.Mock };
  client?: ReturnType<typeof createClient>;
  message?: LocalMessage;
} = {}) =>
  renderHook(
    () =>
      useMessageActionHandlers({
        channel,
        client,
        deleteMessage: jest.fn(),
        deleteReaction: jest.fn(),
        enforceUniqueReaction: false,
        message,
        retrySendMessage: jest.fn(),
        sendReaction: jest.fn(),
        setEditingState: jest.fn(),
        setQuotedMessage: jest.fn(),
        supportedReactions: [],
      }),
    { wrapper: createWrapper(client, channel) },
  );

describe('useMessageActionHandlers notifications', () => {
  it('notifies when pinning a message succeeds', async () => {
    const client = createClient();
    const message = createMessage();
    const { result } = renderUseMessageActionHandlers({ client, message });

    await act(async () => {
      await result.current.handleTogglePinMessage();
    });

    expect(client.pinMessage).toHaveBeenCalledWith(message, null);
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Message pinned',
      options: {
        severity: 'success',
        tags: ['target:channel:channel:messaging:general'],
        type: 'api:message:pin:success',
      },
      origin: {
        context: { message },
        emitter: 'MessageActions',
      },
    });
  });

  it('notifies when marking a message unread fails', async () => {
    const error = new Error('Cannot mark unread');
    const client = createClient();
    const channel = createChannel();
    const message = createMessage();
    channel.markUnread.mockRejectedValue(error);
    const { result } = renderUseMessageActionHandlers({ channel, client, message });

    await act(async () => {
      await result.current.handleMarkUnreadMessage();
    });

    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Cannot mark unread',
      options: {
        originalError: error,
        severity: 'error',
        tags: ['target:channel:channel:messaging:general'],
        type: 'api:message:markUnread:failed',
      },
      origin: {
        context: { message },
        emitter: 'MessageActions',
      },
    });
  });
});
