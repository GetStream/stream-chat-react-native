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
  const listeners = new Set<(value: FakeConfig) => void>();
  const notify = () => listeners.forEach((listener) => listener(config));
  const configState = {
    getLatestValue: (): FakeConfig => config,
    partialNext: (patch: FakeConfig) => {
      config = { ...config, ...patch };
      notify();
    },
    // Mirrors `StateStore.subscribe`: replays the current value immediately and notifies on every write.
    // The hook relies on both — the immediate replay must be a no-op (its handler is already installed),
    // and the write notification is what lets it re-apply after a re-derivation dropped its handlers.
    subscribe: (listener: (value: FakeConfig) => void) => {
      listeners.add(listener);
      listener(config);
      return () => listeners.delete(listener);
    },
  };
  const channel = { cid: 'messaging:test', configState, sendMessage } as unknown as Channel;
  return {
    channel,
    configState,
    getHandlers: () => config.requestHandlers,
    /**
     * Stands in for `Channel.initializeConfig`, which *replaces* `requestHandlers` from the declarative
     * tree rather than merging — what happens on any `client.config.set()` touching `channel`,
     * `messagePaginator` or `messageOperations`.
     */
    simulateReDerivation: () => {
      config = { ...config, requestHandlers: undefined };
      notify();
    },
    sendMessage,
  };
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

  it('leaves handlers it does not own alone', () => {
    const { channel, configState, getHandlers } = createChannel();

    // Registered elsewhere — in production by `client.config.set({ channel: { requestHandlers } })`,
    // which the LLC resolves into `configState`. The hook no longer manages mark-read or delete, so
    // both must survive its writes; it used to `delete` markRead unconditionally, which silently
    // dropped a declaratively-registered handler.
    const deleteMessageRequest = jest.fn();
    const markReadRequest = jest.fn();
    configState.partialNext({ requestHandlers: { deleteMessageRequest, markReadRequest } });

    renderHook(() => useChannelRequestHandlers({ channel }));

    expect(getHandlers()?.deleteMessageRequest).toBe(deleteMessageRequest);
    expect(getHandlers()?.markReadRequest).toBe(markReadRequest);
    // ...while the send/retry pair it does own is registered.
    expect(getHandlers()?.sendMessageRequest).toBeDefined();
    expect(getHandlers()?.retrySendMessageRequest).toBe(getHandlers()?.sendMessageRequest);
  });
  it('re-applies its handlers after a re-derivation drops them', () => {
    const { channel, getHandlers, simulateReDerivation } = createChannel();

    renderHook(() => useChannelRequestHandlers({ channel }));
    const original = getHandlers()?.sendMessageRequest;
    expect(original).toBeDefined();

    // `Channel.initializeConfig` replaces `requestHandlers` wholesale, so any `client.config.set()`
    // touching `channel` / `messagePaginator` / `messageOperations` wipes what this hook wrote. Without
    // the re-apply the attachment-upload step would go with it, silently.
    simulateReDerivation();

    expect(getHandlers()?.sendMessageRequest).toBeDefined();
    expect(getHandlers()?.retrySendMessageRequest).toBe(getHandlers()?.sendMessageRequest);
  });

  it('re-applies a doSendMessageRequest override after a re-derivation', async () => {
    const { channel, getHandlers, simulateReDerivation } = createChannel();
    const doSendMessageRequest = jest.fn().mockResolvedValue({ message: { id: 'from-override' } });

    renderHook(() => useChannelRequestHandlers({ channel, doSendMessageRequest }));
    simulateReDerivation();

    const result = await getHandlers()?.sendMessageRequest?.({ localMessage, message });
    expect(doSendMessageRequest).toHaveBeenCalled();
    expect(result).toEqual({ message: { id: 'from-override' } });
  });

  it('does not loop when its own write re-enters the subscription', () => {
    const { channel, configState } = createChannel();
    const partialNext = jest.spyOn(configState, 'partialNext');

    renderHook(() => useChannelRequestHandlers({ channel }));

    // One write for the initial apply. The subscription's immediate replay sees our own handler and
    // short-circuits, so it must not write again.
    expect(partialNext).toHaveBeenCalledTimes(1);
  });
});
