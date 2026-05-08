import React, { PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';

import { ChannelProvider } from '../../../../contexts/channelContext/ChannelContext';
import { ChannelsProvider } from '../../../../contexts/channelsContext/ChannelsContext';
import { ThreadProvider } from '../../../../contexts/threadContext/ThreadContext';
import { ThreadsProvider } from '../../../../contexts/threadsContext/ThreadsContext';
import { useNotificationTarget } from '../useNotificationTarget';

const channelContext = { channel: { cid: 'messaging:channel' } } as never;
const channelsContext = { channels: [] } as never;
const threadsContext = { threads: [] } as never;

describe('useNotificationTarget', () => {
  it('returns undefined outside notification target providers', () => {
    const { result } = renderHook(() => useNotificationTarget());

    expect(result.current).toBeUndefined();
  });

  it('targets the channel when rendered inside Channel', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <ChannelProvider value={channelContext}>{children}</ChannelProvider>
    );

    const { result } = renderHook(() => useNotificationTarget(), { wrapper });

    expect(result.current).toBe('channel');
  });

  it('prioritizes channel over surrounding list providers', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <ChannelsProvider value={channelsContext}>
        <ThreadsProvider value={threadsContext}>
          <ChannelProvider value={channelContext}>{children}</ChannelProvider>
        </ThreadsProvider>
      </ChannelsProvider>
    );

    const { result } = renderHook(() => useNotificationTarget(), { wrapper });

    expect(result.current).toBe('channel');
  });

  it('targets thread when Channel is in thread-list mode', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <ChannelProvider value={{ ...(channelContext as object), threadList: true } as never}>
        {children}
      </ChannelProvider>
    );

    const { result } = renderHook(() => useNotificationTarget(), { wrapper });

    expect(result.current).toBe('thread');
  });

  it('prioritizes thread over channel', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <ChannelProvider value={channelContext}>
        <ThreadProvider value={{ threadInstance: {} } as never}>{children}</ThreadProvider>
      </ChannelProvider>
    );

    const { result } = renderHook(() => useNotificationTarget(), { wrapper });

    expect(result.current).toBe('thread');
  });

  it('targets list providers when no Channel provider is present', () => {
    const channelListWrapper = ({ children }: PropsWithChildren) => (
      <ChannelsProvider value={channelsContext}>{children}</ChannelsProvider>
    );
    const threadListWrapper = ({ children }: PropsWithChildren) => (
      <ThreadsProvider value={threadsContext}>{children}</ThreadsProvider>
    );

    expect(
      renderHook(() => useNotificationTarget(), { wrapper: channelListWrapper }).result.current,
    ).toBe('channel-list');
    expect(
      renderHook(() => useNotificationTarget(), { wrapper: threadListWrapper }).result.current,
    ).toBe('thread-list');
  });
});
