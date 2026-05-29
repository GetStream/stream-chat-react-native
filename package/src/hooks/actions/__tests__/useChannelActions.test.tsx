import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChatProvider } from '../../../contexts/chatContext/ChatContext';
import type { File } from '../../../types/types';
import { useChannelActions } from '../useChannelActions';

const imageFile: File = {
  name: 'avatar.png',
  size: 1024,
  type: 'image/png',
  uri: 'file:///tmp/avatar.png',
};

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
  uploadImage: jest.fn().mockResolvedValue({ file: 'https://cdn.example.com/uploaded.png' }),
  userID: 'current-user-id',
});

const createChannel = (client: ReturnType<typeof createClient>) =>
  ({
    addMembers: jest.fn(),
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
    updatePartial: jest.fn().mockResolvedValue({}),
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

  it('notifies and calls channel.addMembers when adding members succeeds', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.addMembers(['u-1', 'u-2']);
    });

    expect(channel.addMembers).toHaveBeenCalledWith(['u-1', 'u-2']);
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: '{{count}} members added',
      options: {
        severity: 'success',
        type: 'api:channel:add-members:success',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('notifies with originalError when adding members fails', async () => {
    const error = new Error('add failed');
    const client = createClient();
    const channel = createChannel(client);
    jest.mocked(channel.addMembers).mockRejectedValue(error);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.addMembers(['u-1']);
    });

    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Failed to add members',
      options: {
        originalError: error,
        severity: 'error',
        type: 'api:channel:add-members:failed',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('calls onSuccess after addMembers succeeds', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.addMembers(['u-1'], { onSuccess });
    });

    expect(channel.addMembers).toHaveBeenCalledWith(['u-1']);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('does not call onSuccess when addMembers rejects', async () => {
    const client = createClient();
    const channel = createChannel(client);
    jest.mocked(channel.addMembers).mockRejectedValue(new Error('nope'));
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.addMembers(['u-1'], { onSuccess });
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('notifies and calls channel.updatePartial when updateName succeeds', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateName('New name');
    });

    expect(channel.updatePartial).toHaveBeenCalledWith({ set: { name: 'New name' } });
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Channel name updated',
      options: {
        severity: 'success',
        type: 'api:channel:update-name:success',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('notifies with originalError when updateName fails', async () => {
    const error = new Error('rename failed');
    const client = createClient();
    const channel = createChannel(client);
    jest.mocked(channel.updatePartial).mockRejectedValue(error);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateName('New name');
    });

    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Failed to update channel name',
      options: {
        originalError: error,
        severity: 'error',
        type: 'api:channel:update-name:failed',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('calls onSuccess after updateName succeeds and skips it on failure', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateName('New name', { onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);

    jest.mocked(channel.updatePartial).mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      await result.current.updateName('Other name', { onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('unsets the name when updateName is called with an empty string', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateName('');
    });

    expect(channel.updatePartial).toHaveBeenCalledWith({ unset: ['name'] });
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Channel name updated',
      options: {
        severity: 'success',
        type: 'api:channel:update-name:success',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('unsets the name when updateName is called with a whitespace-only string', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateName('   ');
    });

    expect(channel.updatePartial).toHaveBeenCalledWith({ unset: ['name'] });
  });

  it('uploads image then patches channel and notifies on updateImage success', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateImage(imageFile);
    });

    expect(client.uploadImage).toHaveBeenCalledWith(
      'file:///tmp/avatar.png',
      'avatar.png',
      'image/png',
    );
    expect(channel.updatePartial).toHaveBeenCalledWith({
      set: { image: 'https://cdn.example.com/uploaded.png' },
    });
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Channel image updated',
      options: {
        severity: 'success',
        type: 'api:channel:update-image:success',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('uses doFileUploadRequest instead of client.uploadImage when provided', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const doFileUploadRequest = jest
      .fn()
      .mockResolvedValue({ file: 'https://cdn.custom.com/avatar.png' });
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateImage(imageFile, undefined, doFileUploadRequest);
    });

    expect(doFileUploadRequest).toHaveBeenCalledWith(imageFile);
    expect(client.uploadImage).not.toHaveBeenCalled();
    expect(channel.updatePartial).toHaveBeenCalledWith({
      set: { image: 'https://cdn.custom.com/avatar.png' },
    });
  });

  it('notifies and skips channel.updatePartial when uploadImage rejects', async () => {
    const error = new Error('upload failed');
    const client = createClient();
    client.uploadImage.mockRejectedValueOnce(error);
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateImage(imageFile);
    });

    expect(channel.updatePartial).not.toHaveBeenCalled();
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Failed to update channel image',
      options: {
        originalError: error,
        severity: 'error',
        type: 'api:channel:update-image:failed',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('notifies when uploadImage succeeds but channel.updatePartial rejects', async () => {
    const error = new Error('patch failed');
    const client = createClient();
    const channel = createChannel(client);
    jest.mocked(channel.updatePartial).mockRejectedValueOnce(error);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateImage(imageFile);
    });

    expect(client.uploadImage).toHaveBeenCalledTimes(1);
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Failed to update channel image',
      options: {
        originalError: error,
        severity: 'error',
        type: 'api:channel:update-image:failed',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('unsets the image and skips uploadImage when updateImage is called with null', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateImage(null);
    });

    expect(client.uploadImage).not.toHaveBeenCalled();
    expect(channel.updatePartial).toHaveBeenCalledWith({ unset: ['image'] });
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Channel image updated',
      options: {
        severity: 'success',
        type: 'api:channel:update-image:success',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('notifies with originalError when updateImage(null) fails', async () => {
    const error = new Error('unset failed');
    const client = createClient();
    const channel = createChannel(client);
    jest.mocked(channel.updatePartial).mockRejectedValueOnce(error);
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateImage(null);
    });

    expect(client.uploadImage).not.toHaveBeenCalled();
    expect(client.notifications.add).toHaveBeenCalledWith({
      message: 'Failed to update channel image',
      options: {
        originalError: error,
        severity: 'error',
        type: 'api:channel:update-image:failed',
      },
      origin: {
        context: { channel },
        emitter: 'ChannelActions',
      },
    });
  });

  it('calls onSuccess after updateImage(null) succeeds and skips it on failure', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateImage(null, { onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);

    jest.mocked(channel.updatePartial).mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      await result.current.updateImage(null, { onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls onSuccess for updateImage only after both upload and patch succeed', async () => {
    const client = createClient();
    const channel = createChannel(client);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useChannelActions(channel), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.updateImage(imageFile, { onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);

    client.uploadImage.mockRejectedValueOnce(new Error('nope'));
    await act(async () => {
      await result.current.updateImage(imageFile, { onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);

    jest.mocked(channel.updatePartial).mockRejectedValueOnce(new Error('nope'));
    await act(async () => {
      await result.current.updateImage(imageFile, { onSuccess });
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
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
