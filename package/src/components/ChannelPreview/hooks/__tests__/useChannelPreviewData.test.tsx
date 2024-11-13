import React from 'react';
import { Text, View } from 'react-native';
import { Channel, DefaultGenerics, StreamChat } from 'stream-chat';
import { generateUser } from '../../../../mock-builders/generator/user';
import { DefaultStreamChatGenerics } from '../../../../types/types';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import * as ChatContext from '../../../../contexts/chatContext/ChatContext';
import { generateChannel } from '../../../../mock-builders/generator/channel';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { act, renderHook } from '@testing-library/react-native';
import { useChannelPreviewData } from '../useChannelPreviewData';
import dispatchNotificationMarkRead from '../../../../mock-builders/event/notificationMarkRead';
import dispatchNotificationMarkUnread from '../../../../mock-builders/event/notificationMarkUnread';
import dispatchMessageNew from '../../../../mock-builders/event/messageNew';
import { ChannelPreview } from '../../ChannelPreview';

const PreviewUIComponent = (props) => (
  <>
    <Text testID='channel-id'>{props.channel.id}</Text>
    <Text testID='unread-count'>{props.unread}</Text>
    <View testID='last-event-message'>
      <Text>{props.lastMessage ? props.lastMessage.text : 'Empty Channel'}</Text>
    </View>
  </>
);

describe('useChannelPreviewData', () => {
  const clientUser = generateUser();
  let chatClient: StreamChat<DefaultGenerics> | StreamChat<DefaultStreamChatGenerics>;
  let channelWithUnreadCount: Channel<DefaultStreamChatGenerics>;
  let channelWithoutUnreadCount: Channel<DefaultStreamChatGenerics>;
  const countUnreadMock = jest.fn().mockReturnValue(1);
  const channelOnMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
    channelWithUnreadCount = generateChannel({
      countUnread: countUnreadMock,
      on: channelOnMock,
      state: {
        messages: Array.from({ length: 5 }, generateMessage),
      },
    }) as unknown as Channel<DefaultStreamChatGenerics>;
    channelWithoutUnreadCount = generateChannel({
      countUnread: jest.fn().mockReturnValue(0),
      on: channelOnMock,
      state: {
        messages: Array.from({ length: 5 }, generateMessage),
      },
    }) as unknown as Channel<DefaultStreamChatGenerics>;
    jest.spyOn(ChatContext, 'useChatContext').mockImplementation(
      jest.fn(
        () =>
          ({
            client: chatClient,
          } as unknown as ChatContext.ChatContextValue),
      ),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notification.mark_read', () => {
    it('should set unread count to 0 when the event is emitted', async () => {
      const { result } = renderHook(() =>
        useChannelPreviewData(channelWithUnreadCount, chatClient),
      );

      expect(result.current.unread).toBe(1);

      act(() => dispatchNotificationMarkRead(chatClient, channelWithUnreadCount));

      expect(result.current.unread).toBe(0);
    });

    it('should not set unread count to 0 when the event has no channel cid', async () => {
      const { result } = renderHook(() =>
        useChannelPreviewData(channelWithUnreadCount, chatClient),
      );

      expect(result.current.unread).toBe(1);

      act(() => dispatchNotificationMarkRead(chatClient, generateChannel({ cid: undefined })));

      expect(result.current.unread).toBe(1);
    });
  });

  describe('notification.mark_unread', () => {
    it('should not set unread count when the event has no channel cid', async () => {
      const { result } = renderHook(() =>
        useChannelPreviewData(channelWithoutUnreadCount, chatClient),
      );

      expect(result.current.unread).toBe(0);

      act(() => dispatchNotificationMarkUnread(chatClient, generateChannel({ cid: undefined })));

      expect(result.current.unread).toBe(0);
    });

    it("should not set unread count when the event's channel cid does not match the channel cid", async () => {
      const { result } = renderHook(() =>
        useChannelPreviewData(channelWithoutUnreadCount, chatClient),
      );

      expect(result.current.unread).toBe(0);

      act(() => dispatchNotificationMarkUnread(chatClient, generateChannel({ cid: 'random' })));

      expect(result.current.unread).toBe(0);
    });

    it("should not set unread count when the event's user id does not match the client user id", async () => {
      const { result } = renderHook(() =>
        useChannelPreviewData(channelWithoutUnreadCount, chatClient),
      );

      expect(result.current.unread).toBe(0);

      act(() =>
        dispatchNotificationMarkUnread(
          chatClient,
          generateChannel({ cid: channelWithoutUnreadCount.cid }),
        ),
      );

      expect(result.current.unread).toBe(0);
    });

    it('should set unread count when the event is emitted', async () => {
      const { result } = renderHook(() =>
        useChannelPreviewData(channelWithUnreadCount, chatClient),
      );

      expect(result.current.unread).toBe(1);

      act(() => dispatchNotificationMarkUnread(chatClient, channelWithUnreadCount));

      expect(result.current.unread).toBe(1);
    });
  });
});
