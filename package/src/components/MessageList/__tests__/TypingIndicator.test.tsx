import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import type { TypingUsersState } from 'stream-chat';

import { ChannelProvider } from '../../../contexts/channelContext/ChannelContext';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateStaticUser, generateUser } from '../../../mock-builders/generator/user';
import { Chat } from '../../Chat/Chat';
import { TypingIndicator } from '../TypingIndicator';

afterEach(cleanup);

describe('TypingIndicator', () => {
  it('should render typing indicator for two users', async () => {
    const user0 = generateUser();
    const user1 = generateUser();
    const user2 = generateUser();

    const {
      channels: [channel],
      client,
    } = await initiateClientWithChannels({ customUser: user0 });
    channel.state.typingStore.partialNext({
      typing: {
        user1: { user: user1 },
        user2: { user: user2 },
      } as unknown as TypingUsersState['typing'],
    });

    const { getAllByTestId, getByTestId } = render(
      <Chat client={client}>
        <ChannelProvider value={{ channel } as never}>
          <TypingIndicator />
        </ChannelProvider>
      </Chat>,
    );
    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
      expect(getAllByTestId('user-avatar')).toHaveLength(2);
    });
  });

  it('should render typing indicator for one user', async () => {
    const user0 = generateUser();
    const user1 = generateUser();

    const {
      channels: [channel],
      client,
    } = await initiateClientWithChannels({ customUser: user0 });
    channel.state.typingStore.partialNext({
      typing: { user1: { user: user1 } } as unknown as TypingUsersState['typing'],
    });

    const { getAllByTestId, getByTestId } = render(
      <Chat client={client}>
        <ChannelProvider value={{ channel } as never}>
          <TypingIndicator />
        </ChannelProvider>
      </Chat>,
    );
    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
      expect(getAllByTestId('user-avatar')).toHaveLength(1);
    });
  });

  it('should match typing indicator snapshot', async () => {
    const user0 = generateStaticUser(0);
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(3);

    const {
      channels: [channel],
      client,
    } = await initiateClientWithChannels({ customUser: user0 });
    channel.state.typingStore.partialNext({
      typing: {
        user1: { user: user1 },
        user2: { user: user2 },
      } as unknown as TypingUsersState['typing'],
    });

    const { toJSON } = render(
      <Chat client={client}>
        <ChannelProvider value={{ channel } as never}>
          <TypingIndicator />
        </ChannelProvider>
      </Chat>,
    );
    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
