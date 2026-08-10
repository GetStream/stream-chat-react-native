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

/**
 * We are gonna use following custom UI components for preview and list.
 * If we use ChannelPreviewMessenger or ChannelPreviewLastMessage here, then changes
 * to those components might end up breaking tests for ChannelList, which will be quite painful
 * to debug.
 */
const ChannelPreviewComponent = ({ channel, setActiveChannel }) => (
  <View accessibilityLabel='list-item' onPress={setActiveChannel} testID={channel.id}>
    <Text>{channel.data?.name}</Text>
    <Text>{channel.state.messages[0]?.text}</Text>
  </View>
);

const ChannelListComponent = (props) => {
  const { channels, onSelect } = useChannelsContext();
  return (
    <View testID='channel-list'>
      {channels?.map((channel) => (
        <ChannelPreviewComponent
          {...props}
          channel={channel}
          key={channel.id}
          setActiveChannel={onSelect}
        />
      ))}
    </View>
  );
};

const RefreshingProbe = () => {
  const { refreshing } = useChannelsContext();
  return <Text testID='refreshing'>{`${refreshing}`}</Text>;
};

/**
 * Probe that captures the context `refreshList` (the public, non-forced pull-to-refresh handler) so a
 * test can invoke it directly.
 */
let capturedRefreshList;
const RefreshListProbe = () => {
  const { refreshing, refreshList } = useChannelsContext();
  capturedRefreshList = refreshList;
  return <Text testID='refreshing'>{`${refreshing}`}</Text>;
};

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
    List: ChannelListComponent,
    Preview: ChannelPreviewComponent,
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
        <ChannelList {...props} />
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());
  });

  it('should render a preview of each channel', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} />
      </Chat>,
    );

    await waitFor(() => expect(getByTestId(testChannel1.channel.id)).toBeTruthy());
  });

  it('should re-query channels when filters change', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    render(
      <Chat client={chatClient}>
        <ChannelList {...props} />
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('channel-list')).toBeTruthy();
      expect(screen.getByTestId(testChannel1.channel.id)).toBeTruthy();
    });

    useMockedApis(chatClient, [queryChannelsApi([testChannel2])]);

    screen.rerender(
      <Chat client={chatClient}>
        <ChannelList {...props} filters={{ dummyFilter: true }} />
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
    const staleChannel = [generateChannel({ id: 'stale-channel' })];
    const freshChannel = [generateChannel({ id: 'new-channel' })];
    const spy = jest.spyOn(chatClient, 'queryChannels');
    spy.mockImplementation((filters = {}) => {
      if (Object.prototype.hasOwnProperty.call(filters, 'new-filter')) {
        return deferredCallForFreshFilter.promise;
      }
      return deferredCallForStaleFilter.promise;
    });

    const { rerender, queryByTestId } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} filters={staleFilter} />
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
      expect(queryByTestId('channel-list')).toBeTruthy();
    });

    rerender(
      <Chat client={chatClient}>
        <ChannelList {...props} filters={freshFilter} />
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
      expect(queryByTestId('channel-list')).toBeTruthy();
      expect(queryByTestId('new-channel')).toBeTruthy();
    });
  });

  it('should call `setActiveChannel` on press of a channel in the list', async () => {
    const setActiveChannel = jest.fn();
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    render(
      <Chat client={chatClient}>
        <ChannelList {...props} onSelect={setActiveChannel} />
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
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());

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
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => expect(screen.getByTestId('channel-list')).toBeTruthy());
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
            <ChannelList lockChannelOrder={true} Preview={props.Preview} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-messenger')).toBeTruthy();
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
            <ChannelList {...props} onNewMessage={onNewMessage} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} />
          </Chat>,
        );
        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} onNewMessage={onNewMessage} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} onNewMessageNotification={onNewMessageNotification} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} onAddedToChannel={onAddedToChannel} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} onRemovedFromChannel={onRemovedFromChannel} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} onChannelUpdated={onChannelUpdated} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} onChannelDeleted={onChannelDeleted} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} onChannelHidden={onChannelHidden} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
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
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
        });

        act(() => dispatchConnectionRecoveredEvent(chatClient));

        await waitFor(() => {
          expect(recoverSpy).toHaveBeenCalledWith('connection.recovered', expect.any(Function));
        });
      });
    });

    describe('connection.changed', () => {
      it('should force reconnection refreshes past the pull-to-refresh debounce while keeping them out of the refreshing UI', async () => {
        // Regression guard: a reconnect is the sole trigger that re-watches channels on the fresh
        // socket, so it must bypass the 5s pull-to-refresh throttle (`force`). Without the bypass a
        // second reconnect landing inside the debounce window is dropped and its channels stay
        // un-watched (frozen last message / unread) until the next reconnect > 5s later.
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const createChannelManagerSpy = jest.spyOn(chatClient, 'createChannelManager');
        // Freeze the clock at t=0 for the whole mount so `lastRefresh` is seeded to 0 regardless of
        // how many `Date.now()` calls the render makes.
        const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(0);

        render(
          <Chat client={chatClient}>
            <ChannelList {...props} List={RefreshingProbe} />
          </Chat>,
        );

        // The probe only renders once the mount query populates the list.
        await waitFor(() => {
          expect(screen.getByTestId('refreshing').children[0]).toBe('false');
        });

        // Advance the clock 6s past mount so both reconnects observe t=6000.
        dateNowSpy.mockReturnValue(6000);

        const channelManager = createChannelManagerSpy.mock.results[0]?.value;
        // Spy (not replace) so reconnect queries still hydrate through the mocked axios response and
        // keep the list — and therefore the refreshing probe — mounted.
        const querySpy = jest.spyOn(chatClient, 'queryChannels');

        // Reconnect #1 at t=6000, i.e. 6s after mount → outside the debounce window.
        act(() => dispatchConnectionChangedEvent(chatClient, false));
        act(() => dispatchConnectionChangedEvent(chatClient, true));
        await waitFor(() => {
          expect(querySpy).toHaveBeenCalledTimes(1);
        });
        // Let query #1 settle so the ChannelManager's in-flight guard (isLoading) clears; otherwise it,
        // not the debounce, would be what drops the second query.
        await waitFor(() => {
          expect(channelManager.state.getLatestValue().pagination.isLoading).toBe(false);
        });

        // Reconnect #2 at t=6000, i.e. 0ms after reconnect #1 → inside the debounce window. It fires a
        // fresh query only because reconnection refreshes are forced past the throttle.
        act(() => dispatchConnectionChangedEvent(chatClient, false));
        act(() => dispatchConnectionChangedEvent(chatClient, true));
        await waitFor(() => {
          expect(querySpy).toHaveBeenCalledTimes(2);
        });

        // Background reconnection refreshes never surface in the pull-to-refresh UI.
        expect(screen.getByTestId('refreshing').children[0]).toBe('false');

        await waitFor(() => {
          expect(channelManager.state.getLatestValue().pagination.isLoading).toBe(false);
        });
        dateNowSpy.mockRestore();
      });
    });

    describe('refreshList (pull-to-refresh)', () => {
      it('should throttle a non-forced refresh that lands within the retry interval', async () => {
        // Counterpart to the forced reconnect above: the public `refreshList` is NOT forced, so its
        // 5s debounce must still hold — a second pull within the window of the last successful refresh
        // is a no-op and fires no query.
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const createChannelManagerSpy = jest.spyOn(chatClient, 'createChannelManager');
        const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(0); // mount seeds `lastRefresh` to 0

        render(
          <Chat client={chatClient}>
            <ChannelList {...props} List={RefreshListProbe} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('refreshing').children[0]).toBe('false');
        });

        const channelManager = createChannelManagerSpy.mock.results[0]?.value;
        const querySpy = jest.spyOn(chatClient, 'queryChannels');

        // First pull at t=6000 (6s after mount → outside the window) fires a query.
        dateNowSpy.mockReturnValue(6000);
        await act(async () => {
          await capturedRefreshList?.();
        });
        await waitFor(() => {
          expect(querySpy).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
          expect(channelManager.state.getLatestValue().pagination.isLoading).toBe(false);
        });

        // Second pull at t=6000 (0ms later → inside the window) is throttled: no additional query.
        await act(async () => {
          await capturedRefreshList?.();
        });
        expect(querySpy).toHaveBeenCalledTimes(1);

        dateNowSpy.mockRestore();
      });
    });

    describe('channel.truncated', () => {
      it('should call the `onChannelTruncated` function prop, if provided', async () => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const onChannelTruncated = jest.fn();
        render(
          <Chat client={chatClient}>
            <ChannelList {...props} onChannelTruncated={onChannelTruncated} />
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list')).toBeTruthy();
        });

        act(() => dispatchChannelTruncatedEvent(chatClient, testChannel1.channel));

        await waitFor(() => {
          expect(onChannelTruncated).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
