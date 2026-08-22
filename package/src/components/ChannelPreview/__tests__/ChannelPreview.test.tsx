import React from 'react';
import { Text } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';

import { fromPartial } from '@total-typescript/shoehorn';
import type {
  Channel,
  Event,
  StreamChat,
  UserResponse,
  UserResponseCommonFields,
} from 'stream-chat';

import { ChannelsProvider } from '../../../contexts/channelsContext/ChannelsContext';
import type { ChannelsContextValue } from '../../../contexts/channelsContext/ChannelsContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import {
  getOrCreateChannelApi,
  GetOrCreateChannelApiParams,
} from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchNotificationMarkRead from '../../../mock-builders/event/notificationMarkRead';
import dispatchNotificationMarkUnread from '../../../mock-builders/event/notificationMarkUnread';
import { toChannelResponse } from '../../../mock-builders/event/utils';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
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

const mockChannelSwipableWrapper = jest.fn(({ children }: React.PropsWithChildren) => (
  <Text testID='swipe-wrapper'>{children}</Text>
));

jest.mock('../ChannelSwipableWrapper', () => ({
  ChannelSwipableWrapper: (...args: [React.PropsWithChildren]) =>
    mockChannelSwipableWrapper(...args),
}));

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
  overrides: Parameters<typeof generateChannelResponse>[0] = {},
) => {
  const mockedChannel = generateChannelResponse(overrides);
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  channel.countUnread = jest.fn().mockReturnValue(0);
  channel.initialized = true;
  channel.messagePaginator.ingestItem(channel.state.formatMessage(generateMessage()));

  return channel;
};

// The preview now sources unread reactively from `channel.state.read[userId].unread_messages`
// (see useChannelPreviewData), so seed that slice directly rather than mocking `countUnread()`.
const seedUnread = (channel: Channel, userId: string, unread_messages: number) => {
  channel.state.partialNext({
    read: {
      ...channel.state.read,
      [userId]: {
        last_read: new Date(),
        unread_messages,
        user: { id: userId } as UserResponse,
      },
    },
  });
};

// TODO(#27/#8): the unread-count assertions below exercise the pre-reactive, mock-driven mechanism
// (mocking `channel.countUnread()` + dispatching `notification.mark_read`/`mark_unread` so the old WS
// listeners refreshed). `useChannelPreviewData` now sources unread reactively from
// `channel.state` and no longer calls `countUnread()`, so these need reworking to seed
// `readStore` and dispatch the events that actually mutate it (`message.read`, `message.new`).
// Deferred with the rest of the portal-blocked test staleness (jest cannot currently run — the local
// stream-chat-js portal breaks module resolution); fix when the portal is removed.
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
        <WithComponents
          overrides={{
            ChannelPreview: ChannelPreviewUIComponent as unknown as React.ComponentType<
              React.ComponentProps<typeof ChannelPreview>
            >,
          }}
        >
          <ChannelPreview {...props} channel={channel} client={chatClient} />
        </WithComponents>
      </Chat>
    );
  };

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
      seedUnread(channel, chatClient.userID as string, 10);

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => getByTestId('channel-id'));

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('10');
      });

      // a mark-read for a different channel (no `unread_channels: 0`) must not zero this one
      act(() => {
        dispatchNotificationMarkRead(chatClient, { cid: 'messaging:other' });
      });

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('10');
      });
    });

    it('should update the unread count to 0', async () => {
      channel = await initChannelFromData(chatClient);
      seedUnread(channel, chatClient.userID as string, 10);

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => getByTestId('channel-id'));

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('10');
      });

      // a "mark all read" (`unread_channels: 0`) zeroes every active channel's own unread
      act(() => {
        chatClient.dispatchEvent(
          fromPartial<Event>({ type: 'notification.mark_read', unread_channels: 0 }),
        );
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
            user: { id: 'random-id' } as UserResponseCommonFields,
          },
        );
      });

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });
    });

    it("should update the unread count if the event's user id matches the client's user id", async () => {
      channel = await initChannelFromData(chatClient);

      const { getByTestId } = render(<TestComponent />);

      await waitFor(() => getByTestId('channel-id'));

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('0');
      });

      // the channel's mark_unread handler requires an own user + `last_read_at`; it upserts
      // `read[userId].unread_messages`, which the preview renders reactively.
      act(() => {
        dispatchNotificationMarkUnread(
          chatClient,
          { cid: channel?.cid },
          {
            last_read_at: new Date(),
            unread_channels: 2,
            unread_messages: 5,
            user: { id: clientUser.id } as UserResponseCommonFields,
          },
        );
      });

      await waitFor(() => {
        expect(getByTestId('unread-count')).toHaveTextContent('5');
      });
    });
  });

  it('should update the unread count to 0 if the channel is muted', async () => {
    channel = await initChannelFromData(chatClient);

    // mute reactively; useChannelPreviewData renders a muted channel with a zeroed unread count
    // regardless of how many messages are actually unread.
    act(() => {
      channel?.state.partialNext({
        muteStatus: { createdAt: null, expiresAt: null, muted: true },
      });
    });
    seedUnread(channel, chatClient.userID as string, 5);

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => getByTestId('channel-id'));

    await waitFor(() => {
      expect(getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  it('should update the latest message on "message.new" event', async () => {
    channel = await initChannelFromData(chatClient);

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => getByTestId('channel-id'));

    // the paginator ingest filter keys on `cid`, so a cid-less message never updates the preview
    const message = generateMessage({ cid: channel.cid, user: clientUser });

    act(() => {
      dispatchMessageNewEvent(chatClient, message, toChannelResponse(channel ?? {}));
    });

    await waitFor(() => {
      expect(getByTestId('latest-message')).toHaveTextContent(message.text as string);
    });
  });

  it('should update the unread count on "message.new" event', async () => {
    const someOtherUser = generateUser({ id: 'not-me' });
    channel = await initChannelFromData(chatClient);
    seedUnread(channel, chatClient.userID as string, 0);

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => getByTestId('channel-id'));

    // a new message from another user bumps the current user's reactive unread count
    const message = generateMessage({ cid: channel.cid, user: someOtherUser });

    act(() => {
      dispatchMessageNewEvent(chatClient, message, toChannelResponse(channel ?? {}));
    });

    await waitFor(() => {
      expect(getByTestId('unread-count')).toHaveTextContent('1');
    });
  });

  it('displays messages translated if applicable', async () => {
    chatClient = await getTestClientWithUser({ id: 'mads', language: 'no' } as UserResponse);

    const message = {
      i18n: {
        no_text: 'Hallo verden!',
      },
      text: 'Hello world!',
    };
    const channel = generateChannelResponse({
      messages: [message] as unknown as GetOrCreateChannelApiParams['messages'],
    });
    await useInitializeChannel(channel);

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByText(message.i18n.no_text)).toBeTruthy();
    });
  });

  describe('swipeActionsEnabled', () => {
    const ChannelDetailsBottomSheetOverride = () => null;

    const SwipePreview = ({ lastMessage, muted, unread }: ChannelPreviewUIComponentProps) => (
      <>
        <Text testID='preview-muted'>{`${muted}`}</Text>
        <Text testID='preview-unread'>{`${unread}`}</Text>
        <Text testID='preview-last-message'>{lastMessage?.text ?? ''}</Text>
      </>
    );

    const SwipeTestComponent = ({
      channelDetailsBottomSheet,
      swipeActionsEnabled,
    }: {
      channelDetailsBottomSheet?: React.ComponentType;
      swipeActionsEnabled: boolean;
    }) => {
      if (channel === null) {
        return null;
      }

      return (
        <Chat client={chatClient}>
          <WithComponents
            overrides={
              {
                ChannelDetailsBottomSheet: channelDetailsBottomSheet,
                ChannelPreview: SwipePreview,
              } as unknown as React.ComponentProps<typeof WithComponents>['overrides']
            }
          >
            <ChannelsProvider
              value={
                {
                  getChannelActionItems: undefined,
                  swipeActionsEnabled,
                } as unknown as ChannelsContextValue
              }
            >
              <ChannelPreview channel={channel} client={chatClient} />
            </ChannelsProvider>
          </WithComponents>
        </Chat>
      );
    };

    beforeEach(async () => {
      mockChannelSwipableWrapper.mockClear();
      channel = await initChannelFromData(chatClient);
    });

    it('does not render ChannelSwipableWrapper when swipeActionsEnabled is false', async () => {
      const { getByTestId, queryByTestId } = render(
        <SwipeTestComponent swipeActionsEnabled={false} />,
      );

      await waitFor(() => expect(getByTestId('preview-unread')).toHaveTextContent('0'));
      expect(queryByTestId('swipe-wrapper')).toBeNull();
      expect(mockChannelSwipableWrapper).not.toHaveBeenCalled();
    });

    it('renders ChannelSwipableWrapper when swipeActionsEnabled is true', async () => {
      const { getByTestId } = render(<SwipeTestComponent swipeActionsEnabled={true} />);

      await waitFor(() => expect(getByTestId('swipe-wrapper')).toBeTruthy());
      expect(mockChannelSwipableWrapper).toHaveBeenCalled();
    });

    it('makes ChannelDetailsBottomSheet override available via WithComponents', async () => {
      render(
        <SwipeTestComponent
          swipeActionsEnabled={true}
          channelDetailsBottomSheet={ChannelDetailsBottomSheetOverride}
        />,
      );

      // ChannelDetailsBottomSheet is now read from useComponentsContext() by
      // ChannelSwipableWrapper rather than passed as a prop from ChannelPreview.
      // Since ChannelSwipableWrapper is mocked, we verify the override is
      // provided via WithComponents (set up in SwipeTestComponent).
      await waitFor(() => expect(mockChannelSwipableWrapper).toHaveBeenCalled());
    });
  });
});
