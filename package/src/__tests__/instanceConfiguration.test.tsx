import React from 'react';

import { renderHook } from '@testing-library/react-native';

import { ChannelPaginator } from 'stream-chat';
import type { Channel, StreamChat } from 'stream-chat';

import { useChannelRequestHandlers } from '../components/Channel/hooks/useChannelRequestHandlers';
import { useMarkRead } from '../components/MessageList/hooks/useMarkRead';
import { ChatProvider } from '../contexts/chatContext/ChatContext';
import { initiateClientWithChannels } from '../mock-builders/api/initiateClientWithChannels';

/**
 * Contract tests for the SDK's use of the LLC instance-configuration API (`client.config`).
 *
 * These exist because the migration to it broke things that had no coverage, and the failures were all
 * silent — a raw server flag still reads fine, a `Readonly` config still compiles for a nested write, a
 * spread copy of a channel still looks like a channel. Each test below pins one invariant that, if
 * someone reverts it, produces working-looking code with the wrong behaviour.
 *
 * They deliberately do NOT re-test the LLC. `stream-chat` has its own suite for resolution order and
 * server authority; what is asserted here is that *this* SDK reads the resolved value rather than the
 * server's half, and that its own writes land where it thinks they do.
 */

const seedServerConfig = (
  client: StreamChat,
  channel: Channel,
  config: Record<string, unknown>,
) => {
  client.channelServerConfigsStore.partialNext({
    configs: { ...client.channelServerConfigs, [channel.cid]: config as never },
  });
};

const chatWrapper =
  (client: StreamChat) =>
  ({ children }: { children: React.ReactNode }) => (
    <ChatProvider value={{ client } as never}>{children}</ChatProvider>
  );

describe('instance configuration contract', () => {
  describe('resolved configuration, not the raw server flag', () => {
    it('honours a client-side readEvents opt-out even when the server allows read events', async () => {
      const {
        channels: [channel],
        client,
      } = await initiateClientWithChannels();
      seedServerConfig(client, channel, { name: 'messaging', read_events: true });
      client.config.set({ channel: { readEvents: { enabled: false } } });

      const throttledMarkRead = jest.spyOn(client.messageDeliveryReporter, 'throttledMarkRead');

      const { result } = renderHook(() => useMarkRead(channel), {
        wrapper: chatWrapper(client),
      });
      result.current();

      // Reading `channel.serverConfig?.read_events` here would report `true` and report the read.
      expect(channel.config.readEvents.enabled).toBe(false);
      expect(throttledMarkRead).not.toHaveBeenCalled();
    });

    it('reports the read when both the server and the client allow it', async () => {
      const {
        channels: [channel],
        client,
      } = await initiateClientWithChannels();
      seedServerConfig(client, channel, { name: 'messaging', read_events: true });

      const throttledMarkRead = jest.spyOn(client.messageDeliveryReporter, 'throttledMarkRead');

      const { result } = renderHook(() => useMarkRead(channel), {
        wrapper: chatWrapper(client),
      });
      result.current();

      expect(throttledMarkRead).toHaveBeenCalledWith(channel);
    });

    it('resolves the composer poll gate from configuration rather than the server flag alone', async () => {
      const {
        channels: [channel],
        client,
      } = await initiateClientWithChannels();
      seedServerConfig(client, channel, { name: 'messaging', polls: true });
      client.config.set({ messageComposer: { polls: { enabled: false } } });
      // A composer only re-derives on a configuration or server-config change once it has registered
      // subscriptions — which is what `MessageInput` does. Without this it keeps what it resolved at
      // construction, and the assertion below would pass or fail for the wrong reason.
      channel.messageComposer.registerSubscriptions();

      // `Channel` gates its poll UI on this, so a consumer reading `serverConfig?.polls` would offer
      // poll creation the composer has already refused.
      expect(channel.serverConfig?.polls).toBe(true);
      expect(channel.messageComposer.config.polls.enabled).toBe(false);
    });

    it('caps the composer text limit by the channel type max_message_length', async () => {
      const {
        channels: [channel],
        client,
      } = await initiateClientWithChannels();
      seedServerConfig(client, channel, { name: 'messaging', max_message_length: 120 });
      channel.messageComposer.registerSubscriptions();

      // AutoCompleteInput reads `text.maxLengthOnSend` for the input's maxLength; the LLC applies the
      // server value as an upper bound, so this is where the old `getConfig()?.max_message_length` went.
      expect(channel.messageComposer.config.text.maxLengthOnSend).toBe(120);
    });
  });

  describe('paginator configuration is written through updateConfig', () => {
    it('persists lockItemOrder and doRequest on the channel-list paginator', async () => {
      const { client } = await initiateClientWithChannels();
      const paginator = new ChannelPaginator({ client, id: 'channels:test' });
      const doRequest = jest.fn();

      // `usePaginatedChannels` used to assign into `paginator.config` directly. That object is
      // `Readonly` now, so the assignment is a compile error — and a runtime no-op for nested writes.
      paginator.updateConfig({ lockItemOrder: true });
      paginator.updateConfig({ doRequest });

      expect(paginator.config.lockItemOrder).toBe(true);
      expect(paginator.config.doRequest).toBe(doRequest);
    });

    it('keeps those writes across an unrelated client.config.set', async () => {
      const { client } = await initiateClientWithChannels();
      const paginator = new ChannelPaginator({ client, id: 'channels:test-2' });
      paginator.updateConfig({ lockItemOrder: true });

      // There is no `channelPaginator` configuration key, so nothing re-derives this paginator and an
      // imperative patch survives. If a key is ever added, this breaks — and it should, because
      // `retainPatches` is off and the patch would then be dropped on the next derivation.
      client.config.set({ messageOperations: { failedSendCacheMaxSize: 42 } });

      expect(paginator.config.lockItemOrder).toBe(true);
    });
  });

  describe('channel.configState is a prototype getter', () => {
    it('does not throw for a spread copy of a channel, which no longer carries it', async () => {
      const {
        channels: [channel],
        client,
      } = await initiateClientWithChannels();

      // `configState` moved from an own field to a getter on `Channel.prototype`, so `{...channel}`
      // silently drops it. Tests and integrator code both make such copies; this is the crash that
      // took out `Channel.test.tsx` during the migration.
      const spreadCopy = { ...channel } as Channel;
      expect(spreadCopy.configState).toBeUndefined();

      expect(() =>
        renderHook(() => useChannelRequestHandlers({ channel: spreadCopy }), {
          wrapper: chatWrapper(client),
        }),
      ).not.toThrow();
    });
  });

  describe('the mock builder seeds server configuration where the LLC reads it', () => {
    it('makes serverConfig readable and folds it into the resolved config', async () => {
      const {
        channels: [channel],
      } = await initiateClientWithChannels();

      // `getConfig()` is gone and `serverConfig` is a getter over the client's cid-keyed store, so
      // `jest.spyOn(channel, 'getConfig')` cannot stand in for it. Every test that depends on server
      // configuration depends on this write working.
      expect(channel.serverConfig).toBeDefined();
      expect(channel.config.readEvents.enabled).toBe(channel.serverConfig?.read_events !== false);
    });
  });
});
