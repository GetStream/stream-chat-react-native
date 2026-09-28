import React from 'react';

import { act, renderHook } from '@testing-library/react-native';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import { ChatContext } from '../../../../contexts/chatContext/ChatContext';
import type { ChatContextValue } from '../../../../contexts/chatContext/ChatContext';
import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { useMarkRead } from '../useMarkRead';

const NS_PER_MS = 1_000_000;

describe('useMarkRead', () => {
  let client: StreamChat;
  let channel: Channel;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'me' });
    const response = generateChannelResponse({ messages: [] });
    useMockedApis(client, [getOrCreateChannelApi(response)]);
    channel = client.channel('messaging', response.channel.id);
    await channel.watch();
    jest.spyOn(client.messageDeliveryReporter, 'throttledMarkRead').mockImplementation(() => {});
  });

  const render = () =>
    renderHook(() => useMarkRead(channel), {
      wrapper: ({ children }) => (
        <ChatContext.Provider value={{ client } as unknown as ChatContextValue}>
          {children}
        </ChatContext.Provider>
      ),
    });

  // Messages stamped by a server clock running `aheadMs` ahead of the device.
  const ingest = (texts: string[], aheadMs: number) =>
    texts.map((text, i) => {
      const createdAt = (Date.now() + aheadMs + i) * NS_PER_MS;
      const message = channel.state.formatMessage(
        generateMessage({
          cid: channel.cid,
          created_at: createdAt,
          text,
          user: generateUser({ id: 'other' }),
        }),
      ) as LocalMessage;
      channel.messagePaginator.ingestItem(message);
      return message;
    });

  it('sets the read boundary on the server clock, so a device behind it still covers what was read', () => {
    const read = ingest(['one', 'two', 'three'], 2000);
    const { result } = render();

    act(() => result.current());

    const snapshot = channel.messagePaginator.unreadStateSnapshot.getLatestValue();
    expect(snapshot.unreadCount).toBe(0);
    expect(snapshot.lastReadMessageId).toBe(read[2].id);
    // The separator treats `created_at > lastReadAt` as unread: none of these may qualify.
    read.forEach((message) =>
      expect(message.created_at).toBeLessThanOrEqual(snapshot.lastReadAt as number),
    );

    const [next] = ingest(['four'], 3000);
    expect(next.created_at).toBeGreaterThan(snapshot.lastReadAt as number);
  });

  it('keeps the snapshot as it is when asked not to update the unread state', () => {
    ingest(['one'], 2000);
    const before = channel.messagePaginator.unreadStateSnapshot.getLatestValue();
    const { result } = render();

    act(() => result.current({ updateChannelUnreadState: false }));

    expect(channel.messagePaginator.unreadStateSnapshot.getLatestValue()).toBe(before);
    expect(client.messageDeliveryReporter.throttledMarkRead).toHaveBeenCalledWith(channel);
  });
});
