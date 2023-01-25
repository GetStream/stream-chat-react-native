import React from 'react';
import { Text, View } from 'react-native';

import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react-native';

import { useChannelsContext } from '../../../contexts/channelsContext/ChannelsContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';

import { queryChannelsApi } from '../../../mock-builders/api/queryChannels';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchChannelDeletedEvent from '../../../mock-builders/event/channelDeleted';
import dispatchChannelHiddenEvent from '../../../mock-builders/event/channelHidden';
import dispatchChannelTruncatedEvent from '../../../mock-builders/event/channelTruncated';
import dispatchChannelUpdatedEvent from '../../../mock-builders/event/channelUpdated';
import dispatchConnectionRecoveredEvent from '../../../mock-builders/event/connectionRecovered';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchNotificationAddedToChannelEvent from '../../../mock-builders/event/notificationAddedToChannel';
import dispatchNotificationMessageNewEvent from '../../../mock-builders/event/notificationMessageNew';
import dispatchNotificationRemovedFromChannel from '../../../mock-builders/event/notificationRemovedFromChannel';
import dispatchUserPresenceEvent from '../../../mock-builders/event/userPresence';
import dispatchUserUpdatedEvent from '../../../mock-builders/event/userUpdated';
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
  <View accessibilityRole='list-item' onPress={setActiveChannel} testID={channel.id}>
    <Text>{channel.data.name}</Text>
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

    const { getByTestId, rerender } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('channel-list')).toBeTruthy();
      expect(getByTestId(testChannel1.channel.id)).toBeTruthy();
    });

    useMockedApis(chatClient, [queryChannelsApi([testChannel2])]);

    rerender(
      <Chat client={chatClient}>
        <ChannelList {...props} filters={{ dummyFilter: true }} />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId(testChannel2.channel.id)).toBeTruthy();
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

    const { getByTestId, rerender } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} filters={staleFilter} />
      </Chat>,
    );

    expect(spy).toHaveBeenCalledWith(
      staleFilter,
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );

    await waitFor(() => {
      expect(getByTestId('channel-list')).toBeTruthy();
    });

    rerender(
      <Chat client={chatClient}>
        <ChannelList {...props} filters={freshFilter} />
      </Chat>,
    );

    expect(spy).toHaveBeenCalledWith(
      freshFilter,
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );

    deferredCallForStaleFilter.resolve(staleChannel);
    deferredCallForFreshFilter.resolve(freshChannel);
    await waitFor(() => {
      expect(getByTestId('channel-list')).toBeTruthy();
      expect(getByTestId('new-channel')).toBeTruthy();
    });
  });

  it('should call `setActiveChannel` on press of a channel in the list', async () => {
    const setActiveChannel = jest.fn();
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <ChannelList {...props} onSelect={setActiveChannel} />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId(testChannel1.channel.id)).toBeTruthy();
    });

    fireEvent.press(getByTestId(testChannel1.channel.id));

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
        const { getAllByRole, getByTestId, getByText } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(getByText(newMessage.text)).toBeTruthy();
        });

        const items = getAllByRole('list-item');

        await waitFor(() => {
          expect(within(items[0]).getByText(newMessage.text)).toBeTruthy();
        });
      });

      it('should add channel to top if channel is hidden from the list', async () => {
        const { getAllByRole, getByTestId, getByText } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => expect(getByTestId('channel-list')).toBeTruthy());
        act(() => dispatchChannelHiddenEvent(chatClient, testChannel3.channel));

        const newItems = getAllByRole('list-item');
        await waitFor(() => {
          expect(newItems).toHaveLength(2);
        });

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(getByText(newMessage.text)).toBeTruthy();
        });

        const items = getAllByRole('list-item');

        await waitFor(() => {
          expect(within(items[0]).getByText(newMessage.text)).toBeTruthy();
        });
      });

      it('should not alter order if `lockChannelOrder` prop is true', async () => {
        const { getAllByRole, getByTestId, getByText } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} lockChannelOrder={true} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(getByText(newMessage.text)).toBeTruthy();
        });

        const items = getAllByRole('list-item');

        await waitFor(() => {
          expect(within(items[2]).getByText(newMessage.text)).toBeTruthy();
        });
      });
      it('should call the `onNewMessage` function prop, if provided', async () => {
        const onNewMessage = jest.fn();
        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} onNewMessage={onNewMessage} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
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
        const { getAllByRole, getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );
        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        act(() => dispatchNotificationMessageNewEvent(chatClient, testChannel3.channel));

        await waitFor(() => {
          expect(getByTestId(testChannel3.channel.id)).toBeTruthy();
        });
        const items = getAllByRole('list-item');
        await waitFor(() => {
          expect(within(items[0]).getByTestId(testChannel3.channel.id)).toBeTruthy();
        });
      });

      it('should call the `onMessageNew` function prop, if provided', async () => {
        const onMessageNew = jest.fn();
        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} onMessageNew={onMessageNew} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        act(() => dispatchNotificationMessageNewEvent(chatClient, testChannel2.channel));

        await waitFor(() => {
          expect(onMessageNew).toHaveBeenCalledTimes(1);
        });
      });

      it('should call the `onNewMessageNotification` function prop, if provided', async () => {
        const onNewMessageNotification = jest.fn();
        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} onNewMessageNotification={onNewMessageNotification} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
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
        const { getAllByRole, getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        act(() => dispatchNotificationAddedToChannelEvent(chatClient, testChannel3.channel));

        await waitFor(() => {
          expect(getByTestId(testChannel3.channel.id)).toBeTruthy();
        });

        const items = getAllByRole('list-item');

        await waitFor(() => {
          expect(within(items[0]).getByTestId(testChannel3.channel.id)).toBeTruthy();
        });
      });

      it('should call the `onAddedToChannel` function prop, if provided', async () => {
        const onAddedToChannel = jest.fn();
        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} onAddedToChannel={onAddedToChannel} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
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
        const { getAllByRole, getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        const items = getAllByRole('list-item');
        await waitFor(() => {
          expect(items).toHaveLength(3);
        });

        act(() => dispatchNotificationRemovedFromChannel(chatClient, testChannel3.channel));

        const newItems = getAllByRole('list-item');
        await waitFor(() => {
          expect(newItems).toHaveLength(2);
        });
      });

      it('should call the `onRemovedFromChannel` function prop, if provided', async () => {
        const onRemovedFromChannel = jest.fn();
        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} onRemovedFromChannel={onRemovedFromChannel} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
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
        const { getByTestId, getByText } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        act(() =>
          dispatchChannelUpdatedEvent(chatClient, {
            ...testChannel2.channel,
            name: 'updated',
          }),
        );

        await waitFor(() => {
          expect(getByText('updated')).toBeTruthy();
        });
      });

      it('should call the `onChannelUpdated` function prop, if provided', async () => {
        const onChannelUpdated = jest.fn();
        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} onChannelUpdated={onChannelUpdated} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
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
        const { getAllByRole, getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        const items = getAllByRole('list-item');
        await waitFor(() => {
          expect(items).toHaveLength(2);
        });

        act(() => dispatchChannelDeletedEvent(chatClient, testChannel2.channel));

        const newItems = getAllByRole('list-item');
        await waitFor(() => {
          expect(newItems).toHaveLength(1);
        });
      });

      it('should call the `onChannelDeleted` function prop, if provided', async () => {
        const onChannelDeleted = jest.fn();
        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} onChannelDeleted={onChannelDeleted} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
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
        const { getAllByRole, getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        const items = getAllByRole('list-item');
        await waitFor(() => {
          expect(items).toHaveLength(2);
        });

        act(() => dispatchChannelHiddenEvent(chatClient, testChannel2.channel));

        const newItems = getAllByRole('list-item');
        await waitFor(() => {
          expect(newItems).toHaveLength(1);
        });
      });

      it('should call the `onChannelHidden` function prop, if provided', async () => {
        const onChannelHidden = jest.fn();
        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} onChannelHidden={onChannelHidden} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
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

        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        act(() => dispatchConnectionRecoveredEvent(chatClient));

        await waitFor(() => {
          expect(recoverSpy).toHaveBeenCalledWith('connection.recovered', expect.any(Function));
        });
      });
    });

    describe('channel.truncated', () => {
      it('should call the `onChannelTruncated` function prop, if provided', async () => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const onChannelTruncated = jest.fn();
        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} onChannelTruncated={onChannelTruncated} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        act(() => dispatchChannelTruncatedEvent(chatClient, testChannel1.channel));

        await waitFor(() => {
          expect(onChannelTruncated).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('user.updated', () => {
      it('should call handleEvent in the custom hook if the user updates', async () => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const updateSpy = jest.spyOn(chatClient, 'on');
        const offlineUser = generateUser();

        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        act(() =>
          dispatchUserUpdatedEvent(
            chatClient,
            { ...offlineUser, name: 'dan' },
            testChannel1.channel,
          ),
        );

        await waitFor(() => {
          expect(updateSpy).toHaveBeenCalledWith('user.updated', expect.any(Function));
        });
      });
    });

    describe('user.presence.changed', () => {
      it('should call handleEvent in the custom hook if user presence changes', async () => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const updateSpy = jest.spyOn(chatClient, 'on');
        const offlineUser = generateUser();

        const { getByTestId } = render(
          <Chat client={chatClient}>
            <ChannelList {...props} />
          </Chat>,
        );

        await waitFor(() => {
          expect(getByTestId('channel-list')).toBeTruthy();
        });

        act(() =>
          dispatchUserPresenceEvent(
            chatClient,
            { ...offlineUser, online: true },
            testChannel1.channel,
          ),
        );

        await waitFor(() => {
          expect(updateSpy).toHaveBeenCalledWith('user.presence.changed', expect.any(Function));
        });
      });
    });
  });
});
