import { renderHook } from '@testing-library/react-native';

import type { Channel } from 'stream-chat';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import { useCreateChannelContext } from '../hooks/useCreateChannelContext';

const channel = { id: 'channel-1' } as unknown as Channel;

const baseInput = (overrides: Partial<ChannelContextValue> = {}) =>
  ({
    channel,
    disabled: false,
    enableMessageGroupingByUser: true,
    enforceUniqueReaction: false,
    hasPendingInitialTargetLoad: () => false,
    hideDateSeparators: false,
    hideStickyDateHeader: false,
    maxTimeBetweenGroupedMessages: 1000,
    threadList: false,
    ...overrides,
  }) as ChannelContextValue;

describe('useCreateChannelContext', () => {
  // The memo deliberately lists fewer deps than the value it builds (see its eslint-disable): that
  // is what keeps `useChannelContext` from re-rendering every consumer on channel traffic. Pin the
  // list, because widening it silently is how that property gets lost.
  it('keeps the same object when a non-dep input changes', () => {
    const { rerender, result } = renderHook(
      (props: ChannelContextValue) => useCreateChannelContext(props),
      { initialProps: baseInput() },
    );
    const first = result.current;

    rerender(baseInput({ hideDateSeparators: true, maxTimeBetweenGroupedMessages: 99 }));

    expect(result.current).toBe(first);
  });

  it.each([
    ['channel id', { channel: { id: 'channel-2' } as unknown as Channel }],
    // A disposed channel is replaced by a new instance under the same id.
    ['channel instance', { channel: { id: 'channel-1' } as unknown as Channel }],
    ['disabled', { disabled: true }],
    ['threadList', { threadList: true }],
  ])('builds a new object when %s changes', (_label, overrides) => {
    const { rerender, result } = renderHook(
      (props: ChannelContextValue) => useCreateChannelContext(props),
      { initialProps: baseInput() },
    );
    const first = result.current;

    rerender(baseInput(overrides as Partial<ChannelContextValue>));

    expect(result.current).not.toBe(first);
  });
});
