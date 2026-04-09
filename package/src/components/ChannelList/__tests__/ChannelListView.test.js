import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { ChannelsProvider } from '../../../contexts/channelsContext/ChannelsContext';
import { ChatContext, ChatProvider } from '../../../contexts/chatContext/ChatContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { queryChannelsApi } from '../../../mock-builders/api/queryChannels';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelList } from '../ChannelList';
import { ChannelListView } from '../ChannelListView';

let chatClient;

/**
 * Renders the full ChannelList (which now always uses ChannelListView internally).
 */
const Component = () => (
  <Chat client={chatClient}>
    <ChatContext.Consumer>
      {(context) => (
        <ChatProvider value={{ ...context, isOnline: true }}>
          <ChannelList
            filters={{
              members: {
                $in: ['vishal', 'neil'],
              },
            }}
          />
        </ChatProvider>
      )}
    </ChatContext.Consumer>
  </Chat>
);

const noop = () => {};

/**
 * Renders ChannelListView directly with a mock ChannelsContext for testing
 * error and loading states.
 */
const ComponentWithContextOverrides = ({ error, loadingChannels }) => (
  <Chat client={chatClient}>
    <ChatContext.Consumer>
      {(context) => (
        <ChatProvider value={{ ...context, isOnline: true }}>
          <ChannelsProvider
            value={{
              additionalFlatListProps: {},
              channelListInitialized: !loadingChannels && !error,
              channels: error ? null : [],
              error: error ? new Error('test error') : undefined,
              forceUpdate: 0,
              hasNextPage: false,
              loadingChannels,
              loadingNextPage: false,
              loadMoreThreshold: 0.1,
              loadNextPage: noop,
              maxUnreadCount: 255,
              numberOfSkeletons: 8,
              refreshing: false,
              refreshList: noop,
              reloadList: noop,
              setFlatListRef: noop,
            }}
          >
            <ChannelListView />
          </ChannelsProvider>
        </ChatProvider>
      )}
    </ChatContext.Consumer>
  </Chat>
);

describe('ChannelListView', () => {
  beforeAll(async () => {
    chatClient = await getTestClientWithUser({ id: 'vishal' });
    const c1 = generateChannelResponse();
    const c2 = generateChannelResponse();
    useMockedApis(chatClient, [getOrCreateChannelApi(c1), getOrCreateChannelApi(c2)]);
    const channel1 = chatClient.channel(c1.channel.type, c1.channel.id);
    await channel1.watch();
    const channel2 = chatClient.channel(c2.channel.type, c2.channel.id);
    await channel2.watch();
    useMockedApis(chatClient, [queryChannelsApi([channel1, channel2])]);
  });
  afterEach(cleanup);

  it('renders without crashing', async () => {
    const { getByTestId } = render(<Component />);
    await waitFor(() => {
      expect(getByTestId('channel-list-view')).toBeTruthy();
    });
  });

  it('renders the `EmptyStateIndicator` when no channels are present', async () => {
    useMockedApis(chatClient, [queryChannelsApi([])]);
    const { getByTestId } = render(<Component />);
    await waitFor(() => {
      expect(getByTestId('empty-channel-state-title')).toBeTruthy();
    });
  });

  it('renders the `LoadingErrorIndicator` when `error` prop is true', async () => {
    const { getByTestId } = render(
      <ComponentWithContextOverrides error={true} loadingChannels={false} />,
    );
    await waitFor(() => {
      expect(getByTestId('loading-error')).toBeTruthy();
    });
  });

  it('renders the `LoadingIndicator` when when channels have not yet loaded', async () => {
    const { getByTestId } = render(
      <ComponentWithContextOverrides error={false} loadingChannels={true} />,
    );
    await waitFor(() => {
      expect(getByTestId('channel-list-loading-indicator')).toBeTruthy();
    });
  });
});
