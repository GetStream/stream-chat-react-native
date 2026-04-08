import React from 'react';
import { Text, View } from 'react-native';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';

import { useChannelsContext } from '../../../contexts/channelsContext/ChannelsContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';

import { queryChannelsApi } from '../../../mock-builders/api/queryChannels';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchChannelDeletedEvent from '../../../mock-builders/event/channelDeleted';
import dispatchChannelHiddenEvent from '../../../mock-builders/event/channelHidden';
import dispatchChannelTruncatedEvent from '../../../mock-builders/event/channelTruncated';
import dispatchChannelUpdatedEvent from '../../../mock-builders/event/channelUpdated';
import dispatchConnectionChangedEvent from '../../../mock-builders/event/connectionChanged';
import dispatchConnectionRecoveredEvent from '../../../mock-builders/event/connectionRecovered';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchNotificationAddedToChannelEvent from '../../../mock-builders/event/notificationAddedToChannel';
import dispatchNotificationMessageNewEvent from '../../../mock-builders/event/notificationMessageNew';
import dispatchNotificationRemovedFromChannel from '../../../mock-builders/event/notificationRemovedFromChannel';
import { generateChannel, generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelList } from '../ChannelList';

const mockChannelSwipableWrapper = jest.fn(({ children }) => (
  <View testID='swipe-wrapper'>{children}</View>
));

jest.mock('../../ChannelPreview/ChannelSwipableWrapper', () => ({
  ChannelSwipableWrapper: (...args) => mockChannelSwipableWrapper(...args),
}));

/**
 * Custom Preview component used via WithComponents to verify channel rendering.
 * Receives { channel, muted, unread, lastMessage } from ChannelPreview.
 */
const ChannelPreviewComponent = ({ channel }) => (
  <View accessibilityLabel='list-item' testID={channel.id}>
    <Text>{channel.data?.name}</Text>
    <Text>{channel.state.messages[0]?.text}</Text>
  </View>
);

/**
 * Probe that reads swipeActionsEnabled from ChannelsContext.
 * Used as a Preview override to inspect context values.
 */
const SwipeActionsProbe = () => {
  const { swipeActionsEnabled } = useChannelsContext();
  return <Text testID='swipe-actions-enabled'>{`${swipeActionsEnabled}`}</Text>;
};

/**
 * Probe that reads refreshing from ChannelsContext.
 */
const RefreshingProbe = () => {
  const { refreshing } = useChannelsContext();
  return <Text testID='refreshing'>{`${refreshing}`}</Text>;
};

const ChannelPreviewContent = ({ unread }) => <Text testID='preview-unread'>{`${unread}`}</Text>;

class DeferredPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

describe('ChannelList', () => {
  let chatClient;
  let testChannel1;
  let testChannel2;
  let testChannel3;
  const props = {
    filters: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    chatClient = await getTestClientWithUser({ id: 'dan' });
    testChannel1 = generateChannelResponse();
    testChannel2 = generateChannelResponse();
    testChannel3 = generateChannelResponse();
  });

  afterEach(cleanup);

  it('should render a list of channels without crashing', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: ChannelPreviewComponent }}>
          <ChannelList {...props} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('channel-list-view')).toBeTruthy());
  });

  it('should render a preview of each channel', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: ChannelPreviewComponent }}>
          <ChannelList {...props} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(getByTestId(testChannel1.channel.id)).toBeTruthy());
  });

  it('should re-query channels when filters change', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    render(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: ChannelPreviewComponent }}>
          <ChannelList {...props} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('channel-list-view')).toBeTruthy();
      expect(screen.getByTestId(testChannel1.channel.id)).toBeTruthy();
    });

    useMockedApis(chatClient, [queryChannelsApi([testChannel2])]);

    screen.rerender(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: ChannelPreviewComponent }}>
          <ChannelList {...props} filters={{ dummyFilter: true }} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId(testChannel2.channel.id)).toBeTruthy();
    });
  });

  it('should update if filters are updated while awaiting api call', async () => {
    const deferredCallForStaleFilter = new DeferredPromise();
    const deferredCallForFreshFilter = new DeferredPromise();
    const staleFilter = { 'initial-filter': { a: { $gt: 'c' } } };
    const freshFilter = { 'new-filter': { a: { $gt: 'c' } } };
    const createMockChannel = (id) => {
      const channel = generateChannel({
        data: { name: id },
        id,
        state: { latestMessages: [], members: {}, messages: [], setIsUpToDate: jest.fn() },
      });
      channel.countUnread = () => 0;
      channel.muteStatus = () => ({ muted: false });
      channel.on = jest.fn(() => ({ unsubscribe: jest.fn() }));
      channel.messageComposer = {
        registerDraftEventSubscriptions: jest.fn(() => jest.fn()),
      };
      return channel;
    };
    const staleChannel = [createMockChannel('stale-channel')];
    const freshChannel = [createMockChannel('new-channel')];
    const spy = jest.spyOn(chatClient, 'queryChannels');
    spy.mockImplementation((filters = {}) => {
      if (Object.prototype.hasOwnProperty.call(filters, 'new-filter')) {
        return deferredCallForFreshFilter.promise;
      }
      return deferredCallForStaleFilter.promise;
    });

    const { rerender, queryByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: ChannelPreviewComponent }}>
          <ChannelList {...props} filters={staleFilter} />
        </WithComponents>
      </Chat>,
    );

    expect(spy).toHaveBeenNthCalledWith(
      1,
      staleFilter,
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );

    await waitFor(() => {
      expect(queryByTestId('channel-list-view')).toBeTruthy();
    });

    rerender(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: ChannelPreviewComponent }}>
          <ChannelList {...props} filters={freshFilter} />
        </WithComponents>
      </Chat>,
    );

    expect(spy).toHaveBeenNthCalledWith(
      2,
      freshFilter,
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );

    await act(() => {
      deferredCallForStaleFilter.resolve(staleChannel);
      deferredCallForFreshFilter.resolve(freshChannel);
    });
    await waitFor(() => {
      expect(queryByTestId('channel-list-view')).toBeTruthy();
      expect(queryByTestId('new-channel')).toBeTruthy();
    });
  });

  it('should call `setActiveChannel` on press of a channel in the list', async () => {
    const setActiveChannel = jest.fn();
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    render(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: ChannelPreviewComponent }}>
          <ChannelList {...props} onSelect={setActiveChannel} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId(testChannel1.channel.id)).toBeTruthy();
    });

    fireEvent(screen.getByTestId(testChannel1.channel.id), 'onSelect');

    await waitFor(() => {
      expect(setActiveChannel).toHaveBeenCalledTimes(1);
    });
  });

  it('should expose swipeActionsEnabled=false in ChannelsContext when disabled', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: SwipeActionsProbe }}>
          <ChannelList {...props} swipeActionsEnabled={false} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('swipe-actions-enabled')).toBeTruthy());
    expect(getByTestId('swipe-actions-enabled')).toHaveTextContent('false');
  });

  it('should expose swipeActionsEnabled=true in ChannelsContext by default', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: SwipeActionsProbe }}>
          <ChannelList {...props} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('swipe-actions-enabled')).toBeTruthy());
    expect(getByTestId('swipe-actions-enabled')).toHaveTextContent('true');
  });

  it('should not render ChannelSwipableWrapper when swipeActionsEnabled is false', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId, queryByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: ChannelPreviewContent }}>
          <ChannelList {...props} swipeActionsEnabled={false} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('channel-list-view')).toBeTruthy());
    expect(getByTestId('preview-unread')).toHaveTextContent('0');
    expect(queryByTestId('swipe-wrapper')).toBeNull();
    expect(mockChannelSwipableWrapper).not.toHaveBeenCalled();
  });

  it('should render ChannelSwipableWrapper when swipeActionsEnabled is true', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents value={{ Preview: ChannelPreviewContent }}>
          <ChannelList {...props} swipeActionsEnabled={true} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('channel-list-view')).toBeTruthy());
    expect(getByTestId('swipe-wrapper')).toBeTruthy();
    expect(mockChannelSwipableWrapper).toHaveBeenCalledTimes(1);
  });

  it('should expose ChannelDetailsBottomSheet override via WithComponents', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
    const ChannelDetailsBottomSheetOverride = () => null;

    render(
      <Chat client={chatClient}>
        <WithComponents
          value={{
            ChannelDetailsBottomSheet: ChannelDetailsBottomSheetOverride,
            Preview: ChannelPreviewContent,
          }}
        >
          <ChannelList {...props} swipeActionsEnabled={true} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(mockChannelSwipableWrapper).toHaveBeenCalled());
    const swipableWrapperProps = mockChannelSwipableWrapper.mock.calls[0]?.[0];
    expect(swipableWrapperProps.ChannelDetailsBottomSheet).toBe(ChannelDetailsBottomSheetOverride);
  });

  it('should pass ChannelDetailsBottomSheet override to ChannelSwipableWrapper', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
    const ChannelDetailsBottomSheetOverride = () => null;

    render(
      <Chat client={chatClient}>
        <WithComponents
          value={{
            ChannelDetailsBottomSheet: ChannelDetailsBottomSheetOverride,
            Preview: ChannelPreviewContent,
          }}
        >
          <ChannelList {...props} swipeActionsEnabled={true} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(mockChannelSwipableWrapper).toHaveBeenCalled());
    const swipableWrapperProps = mockChannelSwipableWrapper.mock.calls[0]?.[0];
    expect(swipableWrapperProps.ChannelDetailsBottomSheet).toBe(ChannelDetailsBottomSheetOverride);
  });

  describe('Event handling', () => {
    describe('message.new', () => {
      const sendNewMessageOnChannel3 = () => {
        const newMessage = generateMessage({
          user: generateUser(),
        });
        act(() => dispatchMessageNewEvent(chatClient, newMessage, testChannel3.channel));
        return newMessage;
      };

      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2, testChannel3])]);
      });

      it('should move channel to top of the list by default', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => expect(screen.getByTestId('channel-list-view')).toBeTruthy());

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(screen.getByText(newMessage.text)).toBeTruthy();
        });

        const items = screen.getAllByLabelText('list-item');

        await waitFor(() => {
          expect(within(items[0]).getByText(newMessage.text)).toBeTruthy();
        });
      });

      it('should add channel to top if channel is hidden from the list', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => expect(screen.getByTestId('channel-list-view')).toBeTruthy());
        act(() => dispatchChannelHiddenEvent(chatClient, testChannel3.channel));

        const newItems = screen.getAllByLabelText('list-item');
        await waitFor(() => {
          expect(newItems).toHaveLength(2);
        });

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(screen.getByText(newMessage.text)).toBeTruthy();
        });

        const items = screen.getAllByLabelText('list-item');

        await waitFor(() => {
          expect(within(items[0]).getByText(newMessage.text)).toBeTruthy();
        });
      });

      it('should not alter order if `lockChannelOrder` prop is true', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList lockChannelOrder={true} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(screen.getByText(newMessage.text)).toBeTruthy();
        });

        const items = screen.getAllByLabelText('list-item');

        await waitFor(() => {
          expect(within(items[2]).getByText(newMessage.text)).toBeTruthy();
        });
      });
      it('should call the `onNewMessage` function prop, if provided', async () => {
        const onNewMessage = jest.fn();
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} onNewMessage={onNewMessage} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchMessageNewEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(onNewMessage).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('notification.message_new', () => {
      beforeEach(() => {
        useMockedApis(chatClient, [
          queryChannelsApi([testChannel1, testChannel2]),
          getOrCreateChannelApi(testChannel3),
        ]);
      });

      it('should move a channel to top of the list by default', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );
        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchNotificationMessageNewEvent(chatClient, testChannel3.channel));

        await waitFor(() => {
          expect(screen.getByTestId(testChannel3.channel.id)).toBeTruthy();
        });
        const items = screen.getAllByLabelText('list-item');
        await waitFor(() => {
          expect(within(items[0]).getByTestId(testChannel3.channel.id)).toBeTruthy();
        });
      });

      it('should call the `onNewMessage` function prop, if provided', async () => {
        const onNewMessage = jest.fn();
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} onNewMessage={onNewMessage} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchMessageNewEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(onNewMessage).toHaveBeenCalledTimes(1);
        });
      });

      it('should call the `onNewMessageNotification` function prop, if provided', async () => {
        const onNewMessageNotification = jest.fn();
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} onNewMessageNotification={onNewMessageNotification} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchNotificationMessageNewEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(onNewMessageNotification).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('notification.added_to_channel', () => {
      beforeEach(() => {
        useMockedApis(chatClient, [
          queryChannelsApi([testChannel1, testChannel2]),
          getOrCreateChannelApi(testChannel3),
        ]);
      });

      it('should move a channel to top of the list by default', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchNotificationAddedToChannelEvent(chatClient, testChannel3.channel));

        await waitFor(() => {
          expect(screen.getByTestId(testChannel3.channel.id)).toBeTruthy();
        });

        const items = screen.getAllByLabelText('list-item');

        await waitFor(() => {
          expect(within(items[0]).getByTestId(testChannel3.channel.id)).toBeTruthy();
        });
      });

      it('should call the `onAddedToChannel` function prop, if provided', async () => {
        const onAddedToChannel = jest.fn();
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} onAddedToChannel={onAddedToChannel} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchNotificationAddedToChannelEvent(chatClient, testChannel3.channel));

        await waitFor(() => {
          expect(onAddedToChannel).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('notification.removed_from_channel', () => {
      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2, testChannel3])]);
      });

      it('should remove the channel from list by default', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        const items = screen.getAllByLabelText('list-item');
        await waitFor(() => {
          expect(items).toHaveLength(3);
        });

        act(() => dispatchNotificationRemovedFromChannel(chatClient, testChannel3.channel));

        const newItems = screen.getAllByLabelText('list-item');
        await waitFor(() => {
          expect(newItems).toHaveLength(2);
        });
      });

      it('should call the `onRemovedFromChannel` function prop, if provided', async () => {
        const onRemovedFromChannel = jest.fn();
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} onRemovedFromChannel={onRemovedFromChannel} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchNotificationRemovedFromChannel(chatClient, testChannel3.channel));

        await waitFor(() => {
          expect(onRemovedFromChannel).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.updated', () => {
      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should update a channel in the list by default', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() =>
          dispatchChannelUpdatedEvent(chatClient, {
            ...testChannel2.channel,
            name: 'updated',
          }),
        );

        await waitFor(() => {
          expect(screen.getByText('updated')).toBeTruthy();
        });
      });

      it('should call the `onChannelUpdated` function prop, if provided', async () => {
        const onChannelUpdated = jest.fn();
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} onChannelUpdated={onChannelUpdated} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() =>
          dispatchChannelUpdatedEvent(chatClient, {
            ...testChannel2.channel,
            name: 'updated',
          }),
        );

        await waitFor(() => {
          expect(onChannelUpdated).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.deleted', () => {
      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should remove a channel from the list by default', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        const items = screen.getAllByLabelText('list-item');
        await waitFor(() => {
          expect(items).toHaveLength(2);
        });

        act(() => dispatchChannelDeletedEvent(chatClient, testChannel2.channel));

        const newItems = screen.getAllByLabelText('list-item');
        await waitFor(() => {
          expect(newItems).toHaveLength(1);
        });
      });

      it('should call the `onChannelDeleted` function prop, if provided', async () => {
        const onChannelDeleted = jest.fn();
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} onChannelDeleted={onChannelDeleted} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchChannelDeletedEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(onChannelDeleted).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.hidden', () => {
      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should hide a channel from the list by default', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        const items = screen.getAllByLabelText('list-item');
        await waitFor(() => {
          expect(items).toHaveLength(2);
        });

        act(() => dispatchChannelHiddenEvent(chatClient, testChannel2.channel));

        const newItems = screen.getAllByLabelText('list-item');
        await waitFor(() => {
          expect(newItems).toHaveLength(1);
        });
      });

      it('should call the `onChannelHidden` function prop, if provided', async () => {
        const onChannelHidden = jest.fn();
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} onChannelHidden={onChannelHidden} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchChannelHiddenEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(onChannelHidden).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('connection.recovered', () => {
      it('should call force update to re-render the list', async () => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const recoverSpy = jest.spyOn(chatClient, 'on');

        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchConnectionRecoveredEvent(chatClient));

        await waitFor(() => {
          expect(recoverSpy).toHaveBeenCalledWith('connection.recovered', expect.any(Function));
        });
      });
    });

    describe('connection.changed', () => {
      it('should keep background reconnection refreshes debounced and out of pull-to-refresh UI', async () => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const deferredPromise = new DeferredPromise();
        const dateNowSpy = jest.spyOn(Date, 'now');
        dateNowSpy.mockReturnValueOnce(0);
        dateNowSpy.mockReturnValue(6000);

        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: RefreshingProbe }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('refreshing').children[0]).toBe('false');
        });

        chatClient.queryChannels = jest.fn(() => deferredPromise.promise);

        act(() => dispatchConnectionChangedEvent(chatClient, false));
        act(() => dispatchConnectionChangedEvent(chatClient, true));

        await waitFor(() => {
          expect(chatClient.queryChannels).toHaveBeenCalled();
        });

        act(() => dispatchConnectionChangedEvent(chatClient, true));

        expect(chatClient.queryChannels).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('refreshing').children[0]).toBe('false');

        deferredPromise.resolve([testChannel1]);
        dateNowSpy.mockRestore();
      });
    });

    describe('channel.truncated', () => {
      it('should call the `onChannelTruncated` function prop, if provided', async () => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const onChannelTruncated = jest.fn();
        render(
          <Chat client={chatClient}>
            <WithComponents value={{ Preview: ChannelPreviewComponent }}>
              <ChannelList {...props} onChannelTruncated={onChannelTruncated} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        act(() => dispatchChannelTruncatedEvent(chatClient, testChannel1.channel));

        await waitFor(() => {
          expect(onChannelTruncated).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
