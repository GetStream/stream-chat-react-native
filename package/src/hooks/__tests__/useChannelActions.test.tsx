import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChatProvider } from '../../contexts/chatContext/ChatContext';
import { useChannelActions } from '../useChannelActions';

const createWrapper =
  (client: unknown) =>
  ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client } as never}>{children}</ChatProvider>
  );

const createClient = () => ({
  blockUser: jest.fn(),
  notifications: {
    add: jest.fn(),
    remove: jest.fn(),
    startTimeout: jest.fn(),
  },
  muteUser: jest.fn(),
  unBlockUser: jest.fn(),
  unmuteUser: jest.fn(),
  userID: 'current-user-id',
});

const createChannel = (client: ReturnType<typeof createClient>) =>
  ({
    archive: jest.fn(),
    getClient: () => client,
    mute: jest.fn(),
    pin: jest.fn(),
    removeMembers: jest.fn(),
    state: {
      members: {
        current: { user: { id: 'current-user-id' } },
        other: { user: { id: 'other-user-id', name: 'Other User' } },
      },
    },
    unarchive: jest.fn(),
    unmute: jest.fn(),
    unpin: jest.fn(),
  }) as unknown as Channel;

describe('useChannelActions', () => {
  it('notifies when channel mute succeeds', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.muteChannel();
    });

    expect(channel.mute).toHaveBeenCalledTimes(1);
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Channel muted',
      options: {
        severity: 'success',
        type: 'api:channel:mute:success',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('notifies when channel mute fails', async () => {
    const error = new Error('mute failed');
    const client = createClient();
    const channel = createChannel(client);
    jest.mocked(channel.mute).mockRejectedValue(error);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.muteChannel();
    });

    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Failed to update channel mute status',
      options: {
        originalError: error,
        severity: 'error',
        type: 'api:channel:mute:failed',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('notifies when a direct channel user is blocked', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.blockUser();
    });

    expect(client.blockUser).toHaveBeenCalledWith('other-user-id');
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'User blocked',
      options: {
        severity: 'success',
        type: 'api:user:block:success',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('calls onSuccess after a channel action succeeds', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.muteChannel({ onSuccess });
    });

    expect(channel.mute).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls onSuccess after a direct-channel user action succeeds', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.blockUser({ onSuccess });
    });

    expect(client.blockUser).toHaveBeenCalledWith('other-user-id');
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('awaits async onSuccess before the action promise resolves', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const calls: string[] = [];
    jest.mocked(channel.mute).mockImplementation(() => {
      calls.push('mute');
      return Promise.resolve({} as Awaited<ReturnType<typeof channel.mute>>);
    });
    const onSuccess = jest.fn(async () => {
      await Promise.resolve();
      calls.push('onSuccess');
    });
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.muteChannel({ onSuccess });
    });

    expect(calls).toEqual(['mute', 'onSuccess']);
  });

  it('does not call onSuccess when the underlying action throws', async () => {
    const client = createClient();
    const channel = createChannel(client);
    jest.mocked(channel.mute).mockRejectedValue(new Error('mute failed'));
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.muteChannel({ onSuccess });
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('does not call onSuccess when a direct-channel action short-circuits with no other user', async () => {
    const client = createClient();
    const channel = createChannel(client);
    // Force getOtherUserInDirectChannel to return undefined by collapsing to a single member.
    (channel.state.members as Record<string, unknown>) = {
      current: { user: { id: 'current-user-id' } },
    };
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.blockUser({ onSuccess });
    });

    expect(client.blockUser).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('resolves and notifies when called without options', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.muteChannel();
    });

    expect(channel.mute).toHaveBeenCalledTimes(1);
    expect(client.notifications.add).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Channel muted',
      }),
    );
  });
});
