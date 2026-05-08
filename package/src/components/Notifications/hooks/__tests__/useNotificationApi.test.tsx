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
      result.current.addNotification({
        emitter: 'MessageComposer',
        incident: { domain: 'api', entity: 'message', operation: 'send' },
        message: 'Could not send message',
        severity: 'error',
      });
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
      result.current.addNotification({
        emitter: 'Poll',
        message: 'Poll ended',
        severity: 'success',
        targetPanels: ['channel', 'thread'],
      });
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
      emitter: 'Connection',
      message: 'Reconnecting',
      severity: 'warning',
      tags: ['network'],
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
});
