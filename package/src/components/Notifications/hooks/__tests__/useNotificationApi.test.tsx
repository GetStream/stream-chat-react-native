import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';

import { ChannelProvider } from '../../../../contexts/channelContext/ChannelContext';
import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { useNotificationApi } from '../useNotificationApi';

const createWrapper =
  (client: unknown, channelContext: Record<string, unknown> = {}) =>
  ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client } as never}>
      <ChannelProvider
        value={
          {
            channel: { cid: 'messaging:general' },
            ...channelContext,
          } as never
        }
      >
        {children}
      </ChannelProvider>
    </ChatProvider>
  );

describe('useNotificationApi', () => {
  it('adds inferred target tags and incident-derived types', () => {
    const add = jest.fn();
    const client = {
      notifications: {
        add,
        remove: jest.fn(),
        startTimeout: jest.fn(),
      },
    };
    const { result } = renderHook(() => useNotificationApi(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.addNotification(
        {
          message: 'Could not send message',
          options: { severity: 'error' },
          origin: { emitter: 'MessageComposer' },
        },
        { incident: { domain: 'api', entity: 'message', operation: 'send' } },
      );
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Could not send message',
      options: {
        severity: 'error',
        tags: ['target:channel'],
        type: 'api:message:send:failed',
      },
      origin: { emitter: 'MessageComposer' },
    });
  });

  it('uses explicit target panels instead of inferred panel', () => {
    const add = jest.fn();
    const client = {
      notifications: {
        add,
        remove: jest.fn(),
        startTimeout: jest.fn(),
      },
    };
    const { result } = renderHook(() => useNotificationApi(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.addNotification(
        {
          message: 'Poll ended',
          options: { severity: 'success' },
          origin: { emitter: 'Poll' },
        },
        { targetPanels: ['channel', 'thread'] },
      );
    });

    expect(add).toHaveBeenCalledWith({
      message: 'Poll ended',
      options: {
        severity: 'success',
        tags: ['target:channel', 'target:thread'],
      },
      origin: { emitter: 'Poll' },
    });
  });

  it('adds system notifications with the system tag', () => {
    const add = jest.fn(() => 'notification-id');
    const client = {
      notifications: {
        add,
        remove: jest.fn(),
        startTimeout: jest.fn(),
      },
    };
    const { result } = renderHook(() => useNotificationApi(), {
      wrapper: createWrapper(client, { threadList: true }),
    });

    const id = result.current.addSystemNotification({
      message: 'Reconnecting',
      options: {
        severity: 'warning',
        tags: ['network'],
      },
      origin: { emitter: 'Connection' },
    });

    expect(id).toBe('notification-id');
    expect(add).toHaveBeenCalledWith({
      message: 'Reconnecting',
      options: {
        severity: 'warning',
        tags: ['system', 'network'],
      },
      origin: { emitter: 'Connection' },
    });
  });

  it('removes non-system notifications for a panel', () => {
    const remove = jest.fn();
    const client = {
      notifications: {
        add: jest.fn(),
        notifications: [
          {
            id: 'channel-id',
            origin: { emitter: 'test' },
            tags: ['target:channel'],
          },
          {
            id: 'fallback-channel-id',
            origin: { emitter: 'test' },
          },
          {
            id: 'thread-id',
            origin: { emitter: 'test' },
            tags: ['target:thread'],
          },
          {
            id: 'system-id',
            origin: { emitter: 'test' },
            tags: ['system', 'target:channel'],
          },
        ],
        remove,
        startTimeout: jest.fn(),
      },
    };
    const { result } = renderHook(() => useNotificationApi(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.removeNotificationsForCurrentPanel();
    });

    expect(remove.mock.calls.map(([id]) => id)).toEqual(['channel-id', 'fallback-channel-id']);
  });
});
