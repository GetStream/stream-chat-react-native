import React from 'react';

import { cleanup, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { AccessibilityProvider } from '../../../../contexts/accessibilityContext/AccessibilityContext';
import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { ReactionListClustered } from '../ReactionList/ReactionListClustered';

describe('ReactionListClustered', () => {
  let channel: ChannelType;
  let chatClient: StreamChat;
  let renderReactionList: (
    props: React.ComponentProps<typeof ReactionListClustered>,
  ) => ReturnType<typeof render>;

  const user = generateUser({ id: 'id', name: 'name' });
  const messages = [generateMessage({ user })];

  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannelResponse({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.channel.id);

    renderReactionList = (props) =>
      render(
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <ReactionListClustered {...props} />
          </Channel>
        </Chat>,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('shows the total reaction count across all types', async () => {
    renderReactionList({
      hasReactions: true,
      reactions: [
        { count: 3, own: true, type: 'love' },
        { count: 2, own: false, type: 'like' },
      ],
    });

    await waitFor(() => {
      expect(screen.getByTestId('reaction-list-item-love')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
    });
  });

  it('shows the count for a single reaction type reacted more than once', async () => {
    renderReactionList({
      hasReactions: true,
      reactions: [{ count: 2, own: false, type: 'love' }],
    });

    await waitFor(() => {
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  it('labels the count with the total for screen readers', async () => {
    render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <AccessibilityProvider value={{ enabled: true }}>
            <ReactionListClustered
              hasReactions
              reactions={[
                { count: 3, own: true, type: 'love' },
                { count: 2, own: false, type: 'like' },
              ]}
            />
          </AccessibilityProvider>
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('5 reactions')).toBeTruthy();
    });
  });

  it('hides the count when there is only one reaction', async () => {
    renderReactionList({
      hasReactions: true,
      reactions: [{ count: 1, own: true, type: 'love' }],
    });

    await waitFor(() => {
      expect(screen.getByTestId('reaction-list-item-love')).toBeTruthy();
    });
    expect(screen.queryByText('1')).toBeNull();
  });
});
