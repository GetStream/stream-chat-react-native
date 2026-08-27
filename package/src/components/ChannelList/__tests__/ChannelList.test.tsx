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
import type { Channel as ChannelType, StreamChat, UserResponse } from 'stream-chat';

import { useChannelsContext } from '../../../contexts/channelsContext/ChannelsContext';
import {
  useComponentsContext,
  WithComponents,
} from '../../../contexts/componentsContext/ComponentsContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';

import { queryChannelsApi } from '../../../mock-builders/api/queryChannels';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchChannelDeletedEvent from '../../../mock-builders/event/channelDeleted';
import dispatchChannelHiddenEvent from '../../../mock-builders/event/channelHidden';
import dispatchChannelUpdatedEvent from '../../../mock-builders/event/channelUpdated';
import dispatchChannelVisibleEvent from '../../../mock-builders/event/channelVisible';
import dispatchConnectionChangedEvent from '../../../mock-builders/event/connectionChanged';
import dispatchConnectionRecoveredEvent from '../../../mock-builders/event/connectionRecovered';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchNotificationAddedToChannelEvent from '../../../mock-builders/event/notificationAddedToChannel';
import dispatchNotificationMessageNewEvent from '../../../mock-builders/event/notificationMessageNew';
import dispatchNotificationRemovedFromChannel from '../../../mock-builders/event/notificationRemovedFromChannel';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelList } from '../ChannelList';

const mockChannelSwipableWrapper = jest.fn(({ children }: { children: React.ReactNode }) => (
  <View testID='swipe-wrapper'>{children}</View>
));

jest.mock('../../ChannelPreview/ChannelSwipableWrapper', () => ({
  ChannelSwipableWrapper: (...args: Parameters<typeof mockChannelSwipableWrapper>) =>
    mockChannelSwipableWrapper(...args),
}));

/**
 * Custom ChannelPreview component used via WithComponents to verify channel rendering.
 * Receives { channel, muted, unread, lastMessage } from ChannelPreview.
 */
const ChannelPreviewComponent = ({ channel }: { channel: ChannelType }) => (
  <View accessibilityLabel='list-item' testID={channel.id}>
    <Text>{channel.data?.custom?.name}</Text>
    <Text>{channel.messagePaginator.headItems[0]?.text}</Text>
  </View>
);

/**
 * Probe that reads swipeActionsEnabled from ChannelsContext.
 * Used as a ChannelPreview override to inspect context values.
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

/**
 * Probe that captures the context `refreshList` (the public, non-forced pull-to-refresh handler) so a
 * test can invoke it directly.
 */
let capturedRefreshList: (() => void | Promise<void>) | undefined;
const RefreshListProbe = () => {
  const { refreshing, refreshList } = useChannelsContext();
  capturedRefreshList = refreshList;
  return <Text testID='refreshing'>{`${refreshing}`}</Text>;
};

const ChannelPreviewContent = ({ unread }: { unread?: number }) => (
  <Text testID='preview-unread'>{`${unread}`}</Text>
);

let expectedChannelDetailsBottomSheetOverride: unknown;
const ChannelDetailsBottomSheetProbe = () => {
  const { ChannelDetailsBottomSheet } = useComponentsContext();
  return (
    <Text testID='channel-details-bottom-sheet-override'>
      {`${ChannelDetailsBottomSheet === expectedChannelDetailsBottomSheetOverride}`}
    </Text>
  );
};

class DeferredPromise<T = unknown> {
  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: unknown) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

describe('ChannelList', () => {
  let chatClient: StreamChat;
  let testChannel1: ReturnType<typeof generateChannelResponse>;
  let testChannel2: ReturnType<typeof generateChannelResponse>;
  let testChannel3: ReturnType<typeof generateChannelResponse>;
  const props: Partial<React.ComponentProps<typeof ChannelList>> = {
    filters: {},
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    expectedChannelDetailsBottomSheetOverride = undefined;
    chatClient = await getTestClientWithUser({ id: 'dan' } as UserResponse);
    testChannel1 = generateChannelResponse();
    testChannel2 = generateChannelResponse();
    testChannel3 = generateChannelResponse();
  });

  afterEach(cleanup);

  it('should render a list of channels without crashing', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
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
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
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
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
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
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
          <ChannelList
            {...props}
            filters={{ dummyFilter: true } as React.ComponentProps<typeof ChannelList>['filters']}
          />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId(testChannel2.channel.id)).toBeTruthy();
    });
  });

  it('should re-query channels when predefined filter options change', async () => {
    const queryChannelsSpy = jest.spyOn(chatClient, 'queryChannels');
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    render(
      <Chat client={chatClient}>
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
          <ChannelList
            {...props}
            options={{
              filter_values: { user_id: 'dan' },
              predefined_filter: 'user_messaging',
            }}
          />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId(testChannel1.channel.id)).toBeTruthy();
    });

    // v10: the orchestrator's `ChannelPaginator` issues a single v10-shaped request object to
    // `client.queryChannels(request)` (was the legacy `(filters, sort, options, ...)` positional form).
    // `filter_values` / `predefined_filter` now travel inside that one request object. The trailing
    // `undefined` is the optional per-request `requestOptions` (abort signal) arg the paginator threads
    // through `queryChannelsAndHydrate` (LLC #1828); the channel list never passes one.
    expect(queryChannelsSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        filter_conditions: {},
        filter_values: { user_id: 'dan' },
        offset: 0,
        predefined_filter: 'user_messaging',
      }),
      undefined,
    );

    useMockedApis(chatClient, [queryChannelsApi([testChannel2])]);

    screen.rerender(
      <Chat client={chatClient}>
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
          <ChannelList
            {...props}
            options={{
              filter_values: { user_id: 'sara' },
              predefined_filter: 'user_messaging',
            }}
          />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => {
      expect(queryChannelsSpy).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId(testChannel2.channel.id)).toBeTruthy();
    });

    expect(queryChannelsSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        filter_conditions: {},
        filter_values: { user_id: 'sara' },
        offset: 0,
        predefined_filter: 'user_messaging',
      }),
      undefined,
    );
  });

  it('should re-query and swap results when filters are updated', async () => {
    const deferredCallForStaleFilter = new DeferredPromise();
    const deferredCallForFreshFilter = new DeferredPromise();
    const staleFilter = { 'initial-filter': { a: { $gt: 'c' } } };
    const freshFilter = { 'new-filter': { a: { $gt: 'c' } } };
    // v10: the orchestrator hydrates REAL `Channel` instances from the `queryChannels` response, so the
    // mock must resolve the actual response shape (`{ channels: ChannelResponse[] }`) rather than the
    // hand-rolled channel stubs the legacy `setChannels` array accepted.
    const staleChannel = generateChannelResponse({ id: 'stale-channel' });
    const freshChannel = generateChannelResponse({ id: 'new-channel' });
    const spy = jest.spyOn(chatClient, 'queryChannels');
    // v10: `client.queryChannels(request)` receives a single v10-shaped request object, so the filter to
    // discriminate on now lives under `request.filter_conditions` (was the positional `filters` arg).
    spy.mockImplementation(((request: Parameters<typeof chatClient.queryChannels>[0] = {}) => {
      const filterConditions = request.filter_conditions ?? {};
      if (Object.prototype.hasOwnProperty.call(filterConditions, 'new-filter')) {
        return deferredCallForFreshFilter.promise;
      }
      return deferredCallForStaleFilter.promise;
    }) as unknown as typeof chatClient.queryChannels);

    const { rerender, queryByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
          <ChannelList
            {...props}
            filters={staleFilter as React.ComponentProps<typeof ChannelList>['filters']}
          />
        </WithComponents>
      </Chat>,
    );

    // The paginator issues its query asynchronously (on the post-render effect), so wait for the call
    // instead of asserting synchronously as the legacy synchronous `queryChannels` allowed.
    await waitFor(() => {
      expect(spy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ filter_conditions: staleFilter }),
        undefined,
      );
    });

    // Settle the in-flight first-page query before flipping the filter. The v10 `ChannelPaginator`
    // serializes queries (`canExecuteQuery` blocks while `isLoading`), so a filter change is only
    // guaranteed to trigger a fresh query once the previous one is no longer loading.
    await act(async () => {
      deferredCallForStaleFilter.resolve({ channels: [staleChannel] });
      await deferredCallForStaleFilter.promise;
    });
    await waitFor(() => {
      expect(queryByTestId('stale-channel')).toBeTruthy();
    });

    rerender(
      <Chat client={chatClient}>
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
          <ChannelList
            {...props}
            filters={freshFilter as React.ComponentProps<typeof ChannelList>['filters']}
          />
        </WithComponents>
      </Chat>,
    );

    // The filter change triggers a fresh re-query; its response is still awaiting at this point.
    await waitFor(() => {
      expect(spy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ filter_conditions: freshFilter }),
        undefined,
      );
    });

    await act(async () => {
      deferredCallForFreshFilter.resolve({ channels: [freshChannel] });
      await deferredCallForFreshFilter.promise;
    });
    // Once the fresh api call resolves the list reflects the new filter, replacing the stale channel.
    await waitFor(() => {
      expect(queryByTestId('new-channel')).toBeTruthy();
      expect(queryByTestId('stale-channel')).toBeNull();
    });
  });

  it('should call `setActiveChannel` on press of a channel in the list', async () => {
    const setActiveChannel = jest.fn();
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);

    render(
      <Chat client={chatClient}>
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
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
        <WithComponents overrides={{ ChannelPreview: SwipeActionsProbe }}>
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
        <WithComponents overrides={{ ChannelPreview: SwipeActionsProbe }}>
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
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewContent }}>
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
        <WithComponents overrides={{ ChannelPreview: ChannelPreviewContent }}>
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
    expectedChannelDetailsBottomSheetOverride = ChannelDetailsBottomSheetOverride;

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents
          overrides={{
            ChannelDetailsBottomSheet: ChannelDetailsBottomSheetOverride,
            ChannelPreview: ChannelDetailsBottomSheetProbe,
          }}
        >
          <ChannelList {...props} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('channel-details-bottom-sheet-override')).toBeTruthy());
    expect(getByTestId('channel-details-bottom-sheet-override')).toHaveTextContent('true');
  });

  it('should pass ChannelDetailsBottomSheet override to ChannelSwipableWrapper', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
    const ChannelDetailsBottomSheetOverride = () => null;
    expectedChannelDetailsBottomSheetOverride = ChannelDetailsBottomSheetOverride;

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <WithComponents
          overrides={{
            ChannelDetailsBottomSheet: ChannelDetailsBottomSheetOverride,
            ChannelPreview: ChannelDetailsBottomSheetProbe,
          }}
        >
          <ChannelList {...props} />
        </WithComponents>
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('channel-details-bottom-sheet-override')).toBeTruthy());
    expect(getByTestId('channel-details-bottom-sheet-override')).toHaveTextContent('true');
  });

  describe('Event handling', () => {
    describe('message.new', () => {
      // The message must carry the target channel's `cid`: v10's `MessageIntervalPaginator` filters
      // ingested messages by `cid` (`buildMatchFilters`), so a message without one is dropped and never
      // reaches the channel's `messagePaginator.headItems` that the preview reads.
      const sendNewMessageOnChannel3 = () => {
        const newMessage = generateMessage({
          cid: testChannel3.channel.cid,
          user: generateUser(),
        });
        act(() => dispatchMessageNewEvent(chatClient, newMessage, testChannel3.channel));
        return newMessage;
      };

      const getRenderedOrder = () =>
        screen.getAllByLabelText('list-item').map((item) => item.props.testID);

      // Settle the list to its loaded channels (past the skeleton→channels swap) before reading order.
      const waitForRenderedChannels = async (length: number) => {
        let order: string[] = [];
        await waitFor(() => {
          order = getRenderedOrder();
          expect(order).toHaveLength(length);
        });
        return order;
      };

      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2, testChannel3])]);
      });

      // v10 removed the implicit "float to top" on events: the `ChannelManager` no longer boosts a
      // channel on `message.new`; order is governed purely by `sort` (default = stable, by cid). A new
      // message therefore updates the channel's preview in place without relocating it. (To force a
      // channel to the top an integrator now calls `paginator.boost(cid)`.)
      it('should keep the channel in place on a new message with the default sort', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => expect(screen.getByTestId('channel-list-view')).toBeTruthy());
        const orderBefore = await waitForRenderedChannels(3);

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(screen.getByText(newMessage.text as string)).toBeTruthy();
        });

        // The new message renders inside the receiving channel's own row (its preview updated in place)…
        expect(
          within(screen.getByTestId(testChannel3.channel.id)).getByText(newMessage.text as string),
        ).toBeTruthy();
        // …and the list order is unchanged (no float-to-top).
        expect(getRenderedOrder()).toEqual(orderBefore);
      });

      // v10: a `message.new` alone no longer un-hides a channel client-side (only `channel.visible`
      // clears `data.hidden`), and there is no float-to-top, so a background message does not resurface
      // a channel the user hid. The channel returns to the list when it becomes visible again.
      it('should not resurface a hidden channel on a new message (channel.visible does)', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => expect(screen.getByTestId('channel-list-view')).toBeTruthy());
        await waitForRenderedChannels(3);

        act(() => dispatchChannelHiddenEvent(chatClient, testChannel3.channel));
        await waitFor(() => {
          expect(getRenderedOrder()).toHaveLength(2);
        });

        const newMessage = sendNewMessageOnChannel3();
        // Give the async event pipeline a chance to run; the hidden channel must stay out of the list.
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
        });
        expect(getRenderedOrder()).toHaveLength(2);
        expect(screen.queryByTestId(testChannel3.channel.id)).toBeNull();
        expect(screen.queryByText(newMessage.text as string)).toBeNull();

        act(() => dispatchChannelVisibleEvent(chatClient, testChannel3.channel));
        await waitFor(() => {
          expect(getRenderedOrder()).toHaveLength(3);
        });
        expect(screen.getByTestId(testChannel3.channel.id)).toBeTruthy();
      });

      it('should not alter order if `lockChannelOrder` prop is true', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
              <ChannelList lockChannelOrder={true} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });
        const orderBefore = await waitForRenderedChannels(3);

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(screen.getByText(newMessage.text as string)).toBeTruthy();
        });

        // Order is preserved and the new message renders in the receiving channel's row.
        expect(getRenderedOrder()).toEqual(orderBefore);
        expect(
          within(screen.getByTestId(testChannel3.channel.id)).getByText(newMessage.text as string),
        ).toBeTruthy();
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
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
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
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
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
    });

    describe('notification.removed_from_channel', () => {
      beforeEach(() => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2, testChannel3])]);
      });

      it('should remove the channel from list by default', async () => {
        render(
          <Chat client={chatClient}>
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        await waitFor(() => {
          expect(screen.getAllByLabelText('list-item')).toHaveLength(3);
        });

        act(() => dispatchNotificationRemovedFromChannel(chatClient, testChannel3.channel));

        // v10 routes the event through the `ChannelManager`'s async handler pipeline, so the removal
        // lands after `act()` returns. Flush the pipeline (and the FlatList's deferred cell teardown)
        // on a real timer, then re-query — asserting on a snapshot taken before this would see the old
        // count.
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
        await waitFor(() => {
          expect(screen.getAllByLabelText('list-item')).toHaveLength(2);
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
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
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
            custom: { name: 'updated' },
          }),
        );

        await waitFor(() => {
          expect(screen.getByText('updated')).toBeTruthy();
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
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        await waitFor(() => {
          expect(screen.getAllByLabelText('list-item')).toHaveLength(2);
        });

        act(() => dispatchChannelDeletedEvent(chatClient, testChannel2.channel));

        // The `ChannelManager` removes the channel via its async handler pipeline; flush it (and the
        // FlatList's deferred cell teardown) on a real timer before re-querying.
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
        await waitFor(() => {
          expect(screen.getAllByLabelText('list-item')).toHaveLength(1);
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
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('channel-list-view')).toBeTruthy();
        });

        await waitFor(() => {
          expect(screen.getAllByLabelText('list-item')).toHaveLength(2);
        });

        act(() => dispatchChannelHiddenEvent(chatClient, testChannel2.channel));

        // The `ChannelManager` drops the hidden channel via its async handler pipeline; flush it (and
        // the FlatList's deferred cell teardown) on a real timer before re-querying.
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
        await waitFor(() => {
          expect(screen.getAllByLabelText('list-item')).toHaveLength(1);
        });
      });
    });

    describe('connection.recovered', () => {
      it('should call force update to re-render the list', async () => {
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        const recoverSpy = jest.spyOn(chatClient, 'on');

        render(
          <Chat client={chatClient}>
            <WithComponents overrides={{ ChannelPreview: ChannelPreviewComponent }}>
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
      it('refreshes on every reconnect, however close together, without surfacing in the refreshing UI', async () => {
        // Regression guard for a shipped freeze bug: a reconnect is the trigger that re-watches
        // channels on the fresh socket, so dropping one leaves its channels un-watched and their
        // per-channel state (last message / unread) frozen until the next reconnect or an app reload.
        // The list reorders anyway off member-level `notification.message_new`, which is what made it
        // look like the connection was fine.
        //
        // Recovery is now owned by `client.connectionRecovery`, which has no throttle at all — the
        // 5s window this used to have to be forced past belongs to pull-to-refresh only and is no
        // longer on the reconnect path. The behaviour asserted here is unchanged.
        useMockedApis(chatClient, [queryChannelsApi([testChannel1])]);
        // Freeze the clock at t=0 for the whole mount so `lastRefresh` is seeded to 0 regardless of
        // how many `Date.now()` calls the render makes.
        const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(0);

        render(
          <Chat client={chatClient}>
            <WithComponents overrides={{ ChannelPreview: RefreshingProbe }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        // The probe only renders once the mount query populates the list.
        await waitFor(() => {
          expect(screen.getByTestId('refreshing').children[0]).toBe('false');
        });

        // Advance the clock 6s past mount so both reconnects observe t=6000.
        dateNowSpy.mockReturnValue(6000);

        const channelManager = chatClient.channelManager;
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
          expect(
            channelManager.state.getLatestValue().paginators[0].state.getLatestValue().isLoading,
          ).toBe(false);
        });

        // Reconnect #2 at t=6000, i.e. 0ms after reconnect #1 — well inside what used to be the
        // debounce window. It must still fire a fresh query.
        act(() => dispatchConnectionChangedEvent(chatClient, false));
        act(() => dispatchConnectionChangedEvent(chatClient, true));
        await waitFor(() => {
          expect(querySpy).toHaveBeenCalledTimes(2);
        });

        // Background reconnection refreshes never surface in the pull-to-refresh UI.
        expect(screen.getByTestId('refreshing').children[0]).toBe('false');

        await waitFor(() => {
          expect(
            channelManager.state.getLatestValue().paginators[0].state.getLatestValue().isLoading,
          ).toBe(false);
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
        const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(0); // mount seeds `lastRefresh` to 0

        render(
          <Chat client={chatClient}>
            <WithComponents overrides={{ ChannelPreview: RefreshListProbe }}>
              <ChannelList {...props} />
            </WithComponents>
          </Chat>,
        );

        await waitFor(() => {
          expect(screen.getByTestId('refreshing').children[0]).toBe('false');
        });

        const channelManager = chatClient.channelManager;
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
          expect(
            channelManager.state.getLatestValue().paginators[0].state.getLatestValue().isLoading,
          ).toBe(false);
        });

        // Second pull at t=6000 (0ms later → inside the window) is throttled: no additional query.
        await act(async () => {
          await capturedRefreshList?.();
        });
        expect(querySpy).toHaveBeenCalledTimes(1);

        dateNowSpy.mockRestore();
      });
    });
  });
});
