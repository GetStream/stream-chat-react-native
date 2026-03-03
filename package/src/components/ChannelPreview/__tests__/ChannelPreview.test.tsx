import React from 'react';
import { Text, View } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';

import type { Channel, StreamChat } from 'stream-chat';

import {
  getOrCreateChannelApi,
  GetOrCreateChannelApiParams,
} from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchNotificationMarkRead from '../../../mock-builders/event/notificationMarkRead';
import dispatchNotificationMarkUnread from '../../../mock-builders/event/notificationMarkUnread';
import { generateChannel, generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelPreview } from '../ChannelPreview';

import '@testing-library/jest-native/extend-expect';
import { LastMessageType } from '../hooks/useChannelPreviewData';

type ChannelPreviewUIComponentProps = {
  channel: {
    id: string;
  };
  lastMessage: LastMessageType;
  unread: number;
  muted: boolean;
};

const channelOnMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });

const ChannelPreviewUIComponent = (props: ChannelPreviewUIComponentProps) => {
  return (
    <>
      <Text testID='channel-id'>{props.channel.id}</Text>
      <Text testID='unread-count'>{props.unread}</Text>
      <Text testID='latest-message'>{props.lastMessage?.text}</Text>
    </>
  );
};

const initChannelFromData = async (
  chatClient: StreamChat,
  overrides: Record<string, unknown> = {},
) => {
  const mockedChannel = generateChannelResponse(overrides);
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  channel.countUnread = jest.fn().mockReturnValue(0);
  channel.initialized = true;
  channel.lastMessage = jest.fn().mockReturnValue(generateMessage());
  channel.muteStatus = jest.fn().mockReturnValue({ muted: false });
  channel.state.messages = [generateMessage()];

  return channel;
};

describe('ChannelPreview', () => {
  const clientUser = generateUser();
  let chatClient: StreamChat;
  let channel: Channel | null;

  const TestComponent = (props = {}) => {
    if (channel === null) {
      return null;
    }

    return (
      <Chat client={chatClient}>
        <ChannelPreview
          {...props}
          channel={channel}
          client={chatClient}
          Preview={ChannelPreviewUIComponent}
        />
      </Chat>
    );
  };

  const generateChannelWrapper = (overrides: Record<string, unknown>) =>
    generateChannel({
      countUnread: jest.fn().mockReturnValue(0),
      initialized: true,
      lastMessage: jest.fn().mockReturnValue(generateMessage()),
      muteStatus: jest.fn().mockReturnValue({ muted: false }),
      ...overrides,
    });

  const useInitializeChannel = async (c: GetOrCreateChannelApiParams) => {
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  afterEach(() => {
    channel = null;
  });

  describe('notification.mark_read event', () => {
    it("should not update the unread count if the event's cid does not match the channel's cid", async () => {
      channel = await initChannelFromData(chatClient);

      channel.countUnread = jest.fn().mockReturnValue(10);
      channel.on = channelOnMock;

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => getByTestId('channel-id'));

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('10');
      });

      act(() => {
        dispatchNotificationMarkRead(chatClient, { cid: 'channel-id' });
      });

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('10');
      });
    });

    it('should update the unread count to 0', async () => {
      const channelOnMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
      const countUnreadMock = jest.fn();

      countUnreadMock.mockReturnValue(10);

      channel = await initChannelFromData(chatClient);

      channel.countUnread = countUnreadMock;
      channel.on = channelOnMock;

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => getByTestId('channel-id'));

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('10');
      });

      countUnreadMock.mockReturnValue(0);

      act(() => {
        dispatchNotificationMarkRead(chatClient, channel || {});
      });

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });
    });
  });

  describe('notification.mark_unread event', () => {
    it("should not update the unread count if the event's cid is undefined", async () => {
      const channelOnMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });

      channel = await initChannelFromData(chatClient);

      channel.on = channelOnMock;

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => getByTestId('channel-id'));

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });

      act(() => {
        dispatchNotificationMarkUnread(
          chatClient,
          {},
          {
            unread_channels: 2,
            unread_messages: 5,
          },
        );
      });

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });
    });

    it("should not update the unread count if the event's cid does not match the channel's cid", async () => {
      const channelOnMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });

      channel = await initChannelFromData(chatClient);

      channel.on = channelOnMock;

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => getByTestId('channel-id'));

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });

      act(() => {
        dispatchNotificationMarkUnread(
          chatClient,
          { cid: 'channel-id' },
          {
            unread_channels: 2,
            unread_messages: 5,
          },
        );
      });

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });
    });

    it("should not update the unread count if the event's user id does not match the client's user id", async () => {
      const channelOnMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });

      channel = await initChannelFromData(chatClient);

      channel.on = channelOnMock;

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => getByTestId('channel-id'));

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });

      act(() => {
        dispatchNotificationMarkUnread(
          chatClient,
          { cid: channel?.cid },
          {
            unread_channels: 2,
            unread_messages: 5,
            user: { id: 'random-id' },
          },
        );
      });

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });
    });

    it("should update the unread count if the event's user id matches the client's user id", async () => {
      const c = generateChannelResponse();
      await useInitializeChannel(c);
      const channelOnMock = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });

      const testChannel = generateChannelWrapper({
        ...channel,
        on: channelOnMock,
      });

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => getByTestId('channel-id'));

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });

      act(() => {
        dispatchNotificationMarkUnread(
          chatClient,
          { cid: testChannel?.cid },
          {
            unread_channels: 2,
            unread_messages: 5,
            user: { id: clientUser.id },
          },
        );
      });

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('5');
      });
    });
  });

  it('should update the unread count to 0 if the channel is muted', async () => {
    const someOtherUser = generateUser({ id: 'not-me' });

    const c = generateChannelResponse();
    await useInitializeChannel(c);

    channel.muteStatus = jest.fn().mockReturnValue({ muted: true });

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => getByTestId('channel-id'));

    for (let i = 0; i < 10; i++) {
      const message = generateMessage({
        user: someOtherUser,
      });
      act(() => {
        dispatchMessageNewEvent(chatClient, message, channel || {});
      });
    }
    await waitFor(() => getByTestId('channel-id'));

    await waitFor(() => {
      expect(getByTestId('unread-count')).toHaveTextContent('0');
    });

    act(() => {
      dispatchNotificationMarkUnread(
        chatClient,
        { cid: channel?.cid },
        {
          unread_channels: 2,
          unread_messages: 5,
          user: { id: clientUser.id },
        },
      );
    });

    await waitFor(() => {
      expect(getByTestId('unread-count')).toHaveTextContent('5');
    });
  });

  it('should update the latest message on "message.new" event', async () => {
    const c = generateChannelResponse();
    await useInitializeChannel(c);

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => getByTestId('channel-id'));

    const message = generateMessage({
      user: clientUser,
    });

    act(() => {
      dispatchMessageNewEvent(chatClient, message, channel || {});
    });

    await waitFor(() => {
      expect(getByTestId('latest-message')).toHaveTextContent(message.text);
    });
  });

  it('should update the unread count on "message.new" event', async () => {
    const c = generateChannelResponse();
    await useInitializeChannel(c);

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => getByTestId('channel-id'));

    const message = generateMessage({
      user: clientUser,
    });

    if (channel !== null) {
      channel.countUnread = () => 10;
    }

    act(() => {
      dispatchMessageNewEvent(chatClient, message, channel || {});
    });

    await waitFor(() => {
      expect(getByTestId('unread-count')).toHaveTextContent('10');
    });
  });

  it('displays messages translated if applicable', async () => {
    chatClient = await getTestClientWithUser({ id: 'mads', language: 'no' });

    const message = {
      i18n: {
        no_text: 'Hallo verden!',
      },
      text: 'Hello world!',
    };
    const channel = generateChannelResponse({ messages: [message] });
    await useInitializeChannel(channel);

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByText(message.i18n.no_text)).toBeTruthy();
    });
  });

  describe('swipeActionsEnabled', () => {
    const swipeChannel = { cid: 'messaging:test-channel', id: 'test-channel' } as Channel;
    const swipeClient = { userID: 'test-user-id' };
    const swipeLastMessage = { text: 'hello' } as LastMessageType;

    beforeEach(() => {
      jest.resetModules();
    });

    const renderWithSwipeMocks = ({
      ChannelDetailsBottomSheet,
      swipeActionsEnabled,
    }: {
      ChannelDetailsBottomSheet?: React.ComponentType;
      swipeActionsEnabled: boolean;
    }) => {
      let rendered: ReturnType<typeof import('@testing-library/react-native').render> | undefined;
      const mockChannelSwipableWrapper = jest.fn(({ children }: React.PropsWithChildren) => (
        <View testID='swipe-wrapper'>{children}</View>
      ));

      const PreviewComponent = ({
        lastMessage,
        muted,
        unread,
      }: {
        lastMessage: LastMessageType;
        muted: boolean;
        unread: number;
      }) => (
        <>
          <Text testID='preview-muted'>{`${muted}`}</Text>
          <Text testID='preview-unread'>{`${unread}`}</Text>
          <Text testID='preview-last-message'>{lastMessage?.text ?? ''}</Text>
        </>
      );

      jest.isolateModules(() => {
        jest.doMock('../../../contexts/channelsContext/ChannelsContext', () => ({
          useChannelsContext: () => ({
            ChannelDetailsBottomSheet,
            Preview: PreviewComponent,
            getChannelActionItems: undefined,
            swipeActionsEnabled,
          }),
        }));

        jest.doMock('../../../contexts/chatContext/ChatContext', () => ({
          useChatContext: () => ({ client: swipeClient }),
        }));

        jest.doMock('../hooks/useChannelPreviewData', () => ({
          useChannelPreviewData: () => ({
            lastMessage: swipeLastMessage,
            muted: false,
            unread: 3,
          }),
        }));

        jest.doMock('../../../hooks/useTranslatedMessage', () => ({
          useTranslatedMessage: () => undefined,
        }));

        jest.doMock('../ChannelSwipableWrapper', () => ({
          ChannelSwipableWrapper: (...args: unknown[]) => mockChannelSwipableWrapper(...args),
        }));

        const { render } =
          require('@testing-library/react-native') as typeof import('@testing-library/react-native');
        const { ChannelPreview: IsolatedChannelPreview } =
          require('../ChannelPreview') as typeof import('../ChannelPreview');

        rendered = render(<IsolatedChannelPreview channel={swipeChannel} />);
      });

      if (!rendered) {
        throw new Error('Failed to render ChannelPreview with mocked modules');
      }

      return { ...rendered, mockChannelSwipableWrapper };
    };

    it('does not render ChannelSwipableWrapper when swipeActionsEnabled is false', () => {
      const { getByTestId, queryByTestId, mockChannelSwipableWrapper } = renderWithSwipeMocks({
        swipeActionsEnabled: false,
      });

      expect(getByTestId('preview-muted')).toHaveTextContent('false');
      expect(getByTestId('preview-unread')).toHaveTextContent('3');
      expect(getByTestId('preview-last-message')).toHaveTextContent('hello');
      expect(queryByTestId('swipe-wrapper')).toBeNull();
      expect(mockChannelSwipableWrapper).not.toHaveBeenCalled();
    });

    it('renders ChannelSwipableWrapper when swipeActionsEnabled is true', () => {
      const { getByTestId, mockChannelSwipableWrapper } = renderWithSwipeMocks({
        swipeActionsEnabled: true,
      });

      expect(getByTestId('swipe-wrapper')).toBeTruthy();
      expect(mockChannelSwipableWrapper).toHaveBeenCalledTimes(1);
      expect(getByTestId('preview-unread')).toHaveTextContent('3');
    });

    it('passes ChannelDetailsBottomSheet override to ChannelSwipableWrapper', () => {
      const ChannelDetailsBottomSheetOverride = () => null;

      const { mockChannelSwipableWrapper } = renderWithSwipeMocks({
        ChannelDetailsBottomSheet: ChannelDetailsBottomSheetOverride,
        swipeActionsEnabled: true,
      });

      expect(mockChannelSwipableWrapper).toHaveBeenCalled();
      const swipableWrapperProps = mockChannelSwipableWrapper.mock.calls[0]?.[0];
      expect(swipableWrapperProps).toEqual(
        expect.objectContaining({
          ChannelDetailsBottomSheet: ChannelDetailsBottomSheetOverride,
        }),
      );
    });
  });
});
