import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { ChannelListMessenger } from '../ChannelListMessenger';
import { ChannelList } from '../ChannelList';

import { Chat } from '../../Chat/Chat';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { queryChannelsApi } from '../../../mock-builders/api/queryChannels';
import {
  ChannelsProvider,
  useChannelsContext,
} from '../../../contexts/channelsContext/ChannelsContext';
import { ChatContext, ChatProvider } from '../../../contexts/chatContext/ChatContext';

let mockChannels;
let chatClient;

const ListMessenger = ({ error, loadingChannels, ...props }) => {
  const channelsContext = useChannelsContext();

  return (
    <ChannelsProvider value={{ ...channelsContext, error, loadingChannels }}>
      <ChannelListMessenger {...props} />
    </ChannelsProvider>
  );
};

const Component = ({ error = false, loadingChannels = false }) => (
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
            List={(...props) => (
              <ListMessenger {...props} error={error} loadingChannels={loadingChannels} />
            )}
          />
        </ChatProvider>
      )}
    </ChatContext.Consumer>
  </Chat>
);

describe('ChannelListMessenger', () => {
  beforeAll(async () => {
    chatClient = await getTestClientWithUser({ id: 'vishal' });
    const c1 = generateChannel();
    const c2 = generateChannel();
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
      expect(getByTestId('channel-list-messenger')).toBeTruthy();
    });
  });

  it('renders the `EmptyStateIndicator` when no channels are present', async () => {
    useMockedApis(chatClient, [queryChannelsApi([])]);
    const { getByTestId } = render(<Component channels={[]} />);
    await waitFor(() => {
      expect(getByTestId('empty-channel-state-title')).toBeTruthy();
    });
  });

  it('renders the `LoadingErrorIndicator` when `error` prop is true', async () => {
    const { getByTestId } = render(<Component channels={mockChannels} error={true} />);
    await waitFor(() => {
      expect(getByTestId('loading-error')).toBeTruthy();
    });
  });

  it('renders the `LoadingIndicator` when when channels have not yet loaded', async () => {
    const { getByTestId } = render(<Component channels={[]} loadingChannels={true} />);
    await waitFor(() => {
      expect(getByTestId('channel-list-loading-indicator')).toBeTruthy();
    });
  });
});
