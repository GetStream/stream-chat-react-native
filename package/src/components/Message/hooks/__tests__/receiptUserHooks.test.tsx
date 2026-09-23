import React, { PropsWithChildren } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { useMessageDeliveredData } from '../useMessageDeliveryData';
import { useMessageReadData } from '../useMessageReadData';

describe('receipt user-list hooks', () => {
  let channel: ChannelType;
  let chatClient: StreamChat;
  const me = generateUser({ id: 'me', name: 'me' });
  const alice = generateUser({ id: 'alice', name: 'alice' });
  const bob = generateUser({ id: 'bob', name: 'bob' });

  // Three own messages. Alice will read up to m3, so m1 and m2 are read by her without any cursor
  // ever landing on them.
  const m1 = generateMessage({ timestamp: new Date('2024-01-01T10:00:00Z'), user: me });
  const m2 = generateMessage({ timestamp: new Date('2024-01-01T10:01:00Z'), user: me });
  const m3 = generateMessage({ timestamp: new Date('2024-01-01T10:02:00Z'), user: me });

  beforeEach(async () => {
    const members = [
      generateMember({ user: me }),
      generateMember({ user: alice }),
      generateMember({ user: bob }),
    ];
    const mockedChannel = generateChannelResponse({ members, messages: [m1, m2, m3] });
    chatClient = await getTestClientWithUser(me);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.channel.id);
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <Chat client={chatClient}>
      <Channel channel={channel}>{children}</Channel>
    </Chat>
  );

  // Own read state lands asynchronously when <Channel> mounts, and both hook families include the
  // current user by design, so assertions filter self out — which is what a consumer does too.
  const others = (users: { id: string }[]) =>
    users.map((user) => user.id).filter((id) => id !== me.id);

  const readUpTo = (user: typeof alice, message: typeof m1) =>
    act(() => {
      channel.messageReceiptsTracker.onMessageRead({
        lastReadMessageId: message.id,
        readAt: message.created_at,
        user,
      });
    });

  describe('useMessageReadData — everyone at or past', () => {
    it('includes a reader whose cursor sits on a newer message', async () => {
      const { result } = renderHook(() => useMessageReadData({ message: m1 }), { wrapper });

      readUpTo(alice, m3);

      // The v9 contract: Alice cannot have reached m3 without passing m1.
      await waitFor(() => {
        expect(others(result.current)).toEqual(['alice']);
      });
    });

    it('excludes a reader who has not reached the message yet', async () => {
      const { result } = renderHook(() => useMessageReadData({ message: m3 }), { wrapper });

      readUpTo(alice, m1);

      await waitFor(() => {
        expect(others(result.current)).toEqual([]);
      });
    });
  });

  describe('useMessageDeliveredData — everyone at or past', () => {
    it('includes a member whose delivery cursor sits on a newer message', async () => {
      const { result } = renderHook(() => useMessageDeliveredData({ message: m1 }), { wrapper });

      act(() => {
        channel.messageReceiptsTracker.onMessageDelivered({
          deliveredAt: m3.created_at,
          lastDeliveredMessageId: m3.id,
          user: alice,
        });
      });

      await waitFor(() => {
        expect(others(result.current)).toEqual(['alice']);
      });
    });
  });
});
