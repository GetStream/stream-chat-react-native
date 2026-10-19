import React, { PropsWithChildren } from 'react';

import { StateStore } from '@stream-io/state-store';
import { act, renderHook } from '@testing-library/react-native';
import type { Channel, LocalMessage, StreamChat, UserMuteResponse } from 'stream-chat';

import { ChannelProvider } from '../../../../contexts/channelContext/ChannelContext';
import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { NativeHandlers } from '../../../../native';
import { NotificationTargetProvider } from '../../../Notifications/NotificationTargetContext';
import { useCreateMessageActionHandlers } from '../useCreateMessageActionHandlers';

const createClient = (mutedUsers: UserMuteResponse[] = []) =>
  ({
    moderation: { mute: jest.fn(), unmute: jest.fn() },
    mutedUsersStore: new StateStore<{ mutedUsers: UserMuteResponse[] }>({ mutedUsers }),
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
    moderation: { mute: jest.Mock; unmute: jest.Mock };
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
      useCreateMessageActionHandlers({
        channel,
        client,
        deleteMessage: jest.fn(),
        deleteReaction: jest.fn(),
        message,
        retrySendMessage: jest.fn(),
        sendReaction: jest.fn(),
        setEditingState: jest.fn(),
        setQuotedMessage: jest.fn(),
      }),
    { wrapper: createWrapper(client, channel) },
  );

describe('useCreateMessageActionHandlers notifications', () => {
  it('notifies when pinning a message succeeds', async () => {
    const client = createClient();
    const message = createMessage();
    const { result } = renderUseMessageActionHandlers({ client, message });

    await act(async () => {
      await result.current.handleTogglePinMessage();
    });

    expect(client.pinMessage).toHaveBeenCalledWith(message);
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

describe('useCreateMessageActionHandlers copy', () => {
  const originalSetClipboardString = NativeHandlers.setClipboardString;

  afterEach(() => {
    NativeHandlers.setClipboardString = originalSetClipboardString;
  });

  it('notifies when copying a message succeeds', () => {
    NativeHandlers.setClipboardString = jest.fn((_text, options) => options?.onSuccess?.());
    const client = createClient();
    const message = createMessage();
    const { result } = renderUseMessageActionHandlers({ client, message });

    act(() => {
      result.current.handleCopyMessage();
    });

    expect(NativeHandlers.setClipboardString).toHaveBeenCalledWith(
      'Message text',
      expect.objectContaining({ onFailure: expect.any(Function), onSuccess: expect.any(Function) }),
    );
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Message copied to clipboard',
      options: {
        severity: 'success',
        tags: ['target:channel:channel:messaging:general'],
        type: 'clipboard:message:copy:success',
      },
      origin: { context: { message }, emitter: 'MessageActions' },
    });
  });

  it('notifies when copying a message fails', () => {
    const error = new Error('Clipboard unavailable');
    NativeHandlers.setClipboardString = jest.fn((_text, options) => options?.onFailure?.(error));
    const client = createClient();
    const message = createMessage();
    const { result } = renderUseMessageActionHandlers({ client, message });

    act(() => {
      result.current.handleCopyMessage();
    });

    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Failed to copy message',
      options: {
        originalError: error,
        severity: 'error',
        tags: ['target:channel:channel:messaging:general'],
        type: 'clipboard:message:copy:failed',
      },
      origin: { context: { message }, emitter: 'MessageActions' },
    });
  });

  it('does not copy or notify when the message has no text', () => {
    NativeHandlers.setClipboardString = jest.fn();
    const client = createClient();
    const message = createMessage({ text: '' });
    const { result } = renderUseMessageActionHandlers({ client, message });

    act(() => {
      result.current.handleCopyMessage();
    });

    expect(NativeHandlers.setClipboardString).not.toHaveBeenCalled();
    expect(client.notifications.add).not.toHaveBeenCalled();
  });
});

describe('useCreateMessageActionHandlers state read at call time', () => {
  const muteOf = (targetId: string) =>
    ({
      target: { id: targetId },
      user: { id: 'current-user-id' },
    }) as UserMuteResponse;

  it('unmutes when the author was muted after the handlers were built', async () => {
    const client = createClient();
    const { result } = renderUseMessageActionHandlers({ client });

    client.mutedUsersStore.partialNext({ mutedUsers: [muteOf('message-user-id')] });

    await act(async () => {
      await result.current.handleToggleMuteUser();
    });

    expect(client.moderation.unmute).toHaveBeenCalledWith({ target_ids: ['message-user-id'] });
    expect(client.moderation.mute).not.toHaveBeenCalled();
  });

  it('mutes when only another user is muted', async () => {
    const client = createClient([muteOf('someone-else')]);
    const { result } = renderUseMessageActionHandlers({ client });

    await act(async () => {
      await result.current.handleToggleMuteUser();
    });

    expect(client.moderation.mute).toHaveBeenCalledWith({ target_ids: ['message-user-id'] });
    expect(client.moderation.unmute).not.toHaveBeenCalled();
  });
});
