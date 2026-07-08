import { renderHook } from '@testing-library/react-native';
import type { Channel, LocalMessage, Message } from 'stream-chat';

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
  it('registers no managed handlers when no overrides are provided', () => {
    const { channel, getHandlers } = createChannel();

    renderHook(() => useChannelRequestHandlers({ channel }));

    expect(getHandlers()).toBeUndefined();
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
    expect(sendMessage).toHaveBeenCalledWith(message, undefined);
    expect(result).toEqual({ message: { id: 'fallback' } });
  });

  it('registers updateMessageRequest from doUpdateMessageRequest', async () => {
    const { channel, getHandlers } = createChannel();
    const doUpdateMessageRequest = jest.fn().mockResolvedValue({ message: { id: 'updated' } });

    renderHook(() => useChannelRequestHandlers({ channel, doUpdateMessageRequest }));

    const result = await getHandlers()?.updateMessageRequest?.({ localMessage });
    expect(doUpdateMessageRequest).toHaveBeenCalledWith('messaging:test', localMessage, undefined);
    expect(result).toEqual({ message: { id: 'updated' } });
  });

  it('clears managed handlers when overrides are removed, preserving unrelated handlers', () => {
    const { channel, configState, getHandlers } = createChannel();
    const markReadRequest = jest.fn();
    configState.partialNext({ requestHandlers: { markReadRequest } });

    const doSendMessageRequest = jest.fn();
    const { rerender } = renderHook(
      ({ send }: { send?: typeof doSendMessageRequest }) =>
        useChannelRequestHandlers({ channel, doSendMessageRequest: send }),
      { initialProps: { send: doSendMessageRequest as typeof doSendMessageRequest | undefined } },
    );
    expect(getHandlers()?.sendMessageRequest).toBeDefined();

    rerender({ send: undefined });

    expect(getHandlers()?.sendMessageRequest).toBeUndefined();
    expect(getHandlers()?.retrySendMessageRequest).toBeUndefined();
    // an unrelated handler registered elsewhere must be preserved.
    expect(getHandlers()?.markReadRequest).toBe(markReadRequest);
  });
});
