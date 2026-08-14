import { renderHook } from '@testing-library/react-native';
import type { Channel, LocalMessage, MessageRequest as Message } from 'stream-chat';

import { useChannelRequestHandlers } from '../useChannelRequestHandlers';

// NOTE: `stream-chat` is portaled to a local checkout during this migration; a runtime
// (value) import of it breaks jest resolution. Everything from `stream-chat` here is a
// type-only import (erased at compile time), and `configState` is faked, so no runtime
// `require('stream-chat')` happens.

type FakeRequestHandlers = Record<string, (arg?: unknown) => unknown>;
type FakeConfig = { requestHandlers?: FakeRequestHandlers };

const createChannel = (
  sendMessage: jest.Mock = jest.fn().mockResolvedValue({ message: { id: 'fallback' } }),
) => {
  let config: FakeConfig = {};
  const configState = {
    getLatestValue: (): FakeConfig => config,
    partialNext: (patch: FakeConfig) => {
      config = { ...config, ...patch };
    },
  };
  const channel = { cid: 'messaging:test', configState, sendMessage } as unknown as Channel;
  return { channel, configState, getHandlers: () => config.requestHandlers, sendMessage };
};

const localMessage = { id: 'm1', text: 'hi' } as unknown as LocalMessage;
const message = { text: 'hi' } as unknown as Message;

describe('useChannelRequestHandlers', () => {
  it('always registers the send + retry handler, even with no overrides', () => {
    const { channel, getHandlers } = createChannel();

    renderHook(() => useChannelRequestHandlers({ channel }));

    // The send handler is unconditional (it also drives attachment uploads); send and retry share it.
    expect(getHandlers()?.sendMessageRequest).toBeDefined();
    expect(getHandlers()?.retrySendMessageRequest).toBe(getHandlers()?.sendMessageRequest);
    // update / mark-read stay unset until their overrides are provided.
    expect(getHandlers()?.updateMessageRequest).toBeUndefined();
    expect(getHandlers()?.markReadRequest).toBeUndefined();
  });

  it('awaits uploadPendingAttachments before the default send', async () => {
    const { channel, getHandlers, sendMessage } = createChannel();
    const order: string[] = [];
    const uploadPendingAttachments = jest.fn(() => {
      order.push('upload');
      return Promise.resolve();
    });
    sendMessage.mockImplementation(() => {
      order.push('send');
      return Promise.resolve({ message: { id: 'fallback' } });
    });

    renderHook(() => useChannelRequestHandlers({ channel, uploadPendingAttachments }));

    const result = await getHandlers()?.sendMessageRequest?.({ localMessage, message });

    expect(uploadPendingAttachments).toHaveBeenCalledWith(localMessage);
    expect(order).toEqual(['upload', 'send']);
    expect(result).toEqual({ message: { id: 'fallback' } });
  });

  it('registers send + retry from doSendMessageRequest and returns the override response', async () => {
    const { channel, getHandlers } = createChannel();
    const doSendMessageRequest = jest.fn().mockResolvedValue({ message: { id: 'override' } });

    renderHook(() => useChannelRequestHandlers({ channel, doSendMessageRequest }));

    expect(getHandlers()?.sendMessageRequest).toBeDefined();
    // send and retry share the same wrapper.
    expect(getHandlers()?.retrySendMessageRequest).toBe(getHandlers()?.sendMessageRequest);

    const result = await getHandlers()?.sendMessageRequest?.({ localMessage, message });
    expect(doSendMessageRequest).toHaveBeenCalledWith('messaging:test', message, undefined);
    expect(result).toEqual({ message: { id: 'override' } });
  });

  it('falls back to channel.sendMessage when the override resolves without a message', async () => {
    const { channel, getHandlers, sendMessage } = createChannel();
    const doSendMessageRequest = jest.fn().mockResolvedValue(undefined);

    renderHook(() => useChannelRequestHandlers({ channel, doSendMessageRequest }));

    const result = await getHandlers()?.sendMessageRequest?.({ localMessage, message });
    expect(sendMessage).toHaveBeenCalledWith({ message });
    expect(result).toEqual({ message: { id: 'fallback' } });
  });

  it('registers updateMessageRequest from doUpdateMessageRequest', async () => {
    const { channel, getHandlers } = createChannel();
    const doUpdateMessageRequest = jest.fn().mockResolvedValue({ message: { id: 'updated' } });

    renderHook(() => useChannelRequestHandlers({ channel, doUpdateMessageRequest }));

    const result = await getHandlers()?.updateMessageRequest?.({ localMessage });
    // The handler now forwards the update-message payload (id + the new-message payload derived
    // from the local message) rather than the raw LocalMessage.
    expect(doUpdateMessageRequest).toHaveBeenCalledWith(
      'messaging:test',
      { id: 'm1', message: { id: 'm1', text: 'hi' } },
      undefined,
    );
    expect(result).toEqual({ message: { id: 'updated' } });
  });

  it('clears the managed update handler when its override is removed, preserving unrelated handlers', () => {
    const { channel, configState, getHandlers } = createChannel();
    // mark-read is now a hook-managed handler, so use delete (which the hook never touches) as the
    // "registered elsewhere" handler that must survive a re-run.
    const deleteMessageRequest = jest.fn();
    configState.partialNext({ requestHandlers: { deleteMessageRequest } });

    const doUpdateMessageRequest = jest.fn();
    const { rerender } = renderHook(
      ({ update }: { update?: typeof doUpdateMessageRequest }) =>
        useChannelRequestHandlers({ channel, doUpdateMessageRequest: update }),
      {
        initialProps: {
          update: doUpdateMessageRequest as typeof doUpdateMessageRequest | undefined,
        },
      },
    );
    expect(getHandlers()?.updateMessageRequest).toBeDefined();

    rerender({ update: undefined });

    expect(getHandlers()?.updateMessageRequest).toBeUndefined();
    // the send handler is always registered, independent of overrides.
    expect(getHandlers()?.sendMessageRequest).toBeDefined();
    // an unrelated handler registered elsewhere must be preserved.
    expect(getHandlers()?.deleteMessageRequest).toBe(deleteMessageRequest);
  });
});
