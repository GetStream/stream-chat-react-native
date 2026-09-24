import React from 'react';

import { act, cleanup, render, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { Channel } from '../../..';
import { OverlayProvider } from '../../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Streami18n } from '../../../../utils/i18n/Streami18n';
import { Chat } from '../../../Chat/Chat';
import { MessageStatus } from '../MessageStatus';

let chatClient: StreamChat;
let i18nInstance: Streami18n;
let channel: ChannelType;
describe('MessageStatus', () => {
  const user1 = generateUser({ id: 'id1', name: 'name1' });
  const user2 = generateUser({ id: 'id2', name: 'name2' });
  const user3 = generateUser({ id: 'id3', name: 'name3' });
  const messages = [generateMessage({ user: user1 })];
  const members = [
    generateMember({ user: user1 }),
    generateMember({ user: user2 }),
    generateMember({ user: user3 }),
  ];
  beforeAll(() => {
    i18nInstance = new Streami18n();
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    const mockedChannel = generateChannelResponse({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user1);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.channel.id);

    channel.state.members = Object.fromEntries(
      members.map((member) => [member.user_id, member]),
    ) as unknown as typeof channel.state.members;
  });
  afterEach(cleanup);

  const renderMessageStatus = (
    options: Partial<React.ComponentProps<typeof MessageStatus>>,
    channelProps?: Partial<React.ComponentProps<typeof Channel>>,
  ) =>
    render(
      <OverlayProvider accessibility={{ enabled: true }}>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <Channel channel={channel} {...channelProps}>
            <MessageStatus {...options} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

  it.each([
    [false, false, 'sending', 'Sending'],
    [true, true, 'received', 'Read'],
    [false, false, 'received', 'Sent'],
    [true, false, 'received', 'Delivered'],
  ] as [boolean, boolean, string, string][])(
    'renders the %s status when delivered is %s and read is %s and status is %s',
    async (delivered, read, status, accessibilityLabel) => {
      const user = generateUser();
      const message = generateMessage({ user });
      const { getByLabelText } = renderMessageStatus({
        delivered,
        message: { ...message, status },
        read,
      });
      await waitFor(() => {
        expect(getByLabelText(accessibilityLabel)).toBeTruthy();
      });
    },
  );

  describe('reactive receipt state', () => {
    // Two own messages, older first. `olderMessage` is the one under test throughout: the whole
    // point of sourcing from `lastReadRefByOthers` is that it reports correctly even though no
    // read cursor ever lands on it.
    const olderMessage = generateMessage({
      timestamp: new Date('2024-01-01T10:00:00Z'),
      user: user1,
    });
    const newerMessage = generateMessage({
      timestamp: new Date('2024-01-01T11:00:00Z'),
      user: user1,
    });

    it('reports an older message as read once another member has read past it', async () => {
      const { getByLabelText } = renderMessageStatus({ message: olderMessage });

      await waitFor(() => {
        expect(getByLabelText('Sent')).toBeTruthy();
      });

      act(() => {
        channel.messageReceiptsTracker.onMessageRead({
          lastReadMessageId: newerMessage.id,
          readAt: newerMessage.created_at,
          user: user2,
        });
      });

      await waitFor(() => {
        expect(getByLabelText('Read')).toBeTruthy();
      });

      // Guards against silently falling back to the per-message maps: no cursor is parked on the
      // older message, so `readersByMessageId` has nothing for it and would report "sent".
      expect(
        channel.messageReceiptsTracker.snapshotStore.getLatestValue().readersByMessageId[
          olderMessage.id
        ],
      ).toBeUndefined();
    });

    it('reports delivered, not read, when another member has only received past it', async () => {
      const { getByLabelText } = renderMessageStatus({ message: olderMessage });

      act(() => {
        channel.messageReceiptsTracker.onMessageDelivered({
          deliveredAt: newerMessage.created_at,
          lastDeliveredMessageId: newerMessage.id,
          user: user2,
        });
      });

      await waitFor(() => {
        expect(getByLabelText('Delivered')).toBeTruthy();
      });
    });

    it('ignores the current user own read cursor', async () => {
      const { getByLabelText } = renderMessageStatus({ message: olderMessage });

      act(() => {
        channel.messageReceiptsTracker.onMessageRead({
          lastReadMessageId: newerMessage.id,
          readAt: newerMessage.created_at,
          user: user1,
        });
      });

      // Reading our own channel says nothing about whether anyone else received the message.
      await waitFor(() => {
        expect(getByLabelText('Sent')).toBeTruthy();
      });
    });

    it('does not report a message newer than the furthest cursor', async () => {
      const { getByLabelText } = renderMessageStatus({ message: newerMessage });

      act(() => {
        channel.messageReceiptsTracker.onMessageRead({
          lastReadMessageId: olderMessage.id,
          readAt: olderMessage.created_at,
          user: user2,
        });
      });

      await waitFor(() => {
        expect(getByLabelText('Sent')).toBeTruthy();
      });
    });

    it('prefers explicit props over the reactive state', async () => {
      const { getByLabelText } = renderMessageStatus({ message: olderMessage, read: true });

      // Nobody has read anything, but the prop is an override for callers composing their own
      // footer around this component.
      await waitFor(() => {
        expect(getByLabelText('Read')).toBeTruthy();
      });
    });
  });
});
