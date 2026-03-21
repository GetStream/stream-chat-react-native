import React from 'react';

import { cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { ChannelsStateProvider } from '../../../../contexts/channelsStateContext/ChannelsStateContext';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { ReactionListTop } from '../ReactionList/ReactionListTop';

describe('ReactionListTop', () => {
  let channel;
  let chatClient;
  let renderMessage;

  const user = generateUser({ id: 'id', name: 'name' });
  const messages = [generateMessage({ user })];

  beforeEach(async () => {
    jest.clearAllMocks();
    cleanup();
    const members = [generateMember({ user })];
    const mockedChannel = generateChannelResponse({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);

    renderMessage = (options, channelProps) =>
      render(
        <ChannelsStateProvider>
          <Chat client={chatClient}>
            <Channel channel={channel} {...channelProps}>
              <ReactionListTop {...options} />
            </Channel>
          </Chat>
        </ChannelsStateProvider>,
      );
  });

  it('renders the ReactionListTop component', async () => {
    renderMessage({
      hasReactions: true,
      messageContentWidth: 100,
      reactions: [{ count: 1, own: true, type: 'love' }],
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Reaction List Top')).toBeTruthy();
    });
  });

  it('return null in ReactionListTop component when hasReactions false', async () => {
    renderMessage({
      hasReactions: false,
      messageContentWidth: 100,
      reactions: [{ count: 1, own: true, type: 'love' }],
    });

    await waitFor(() => {
      expect(screen.queryByLabelText('Reaction List Top')).toBeNull();
    });
  });

  it('return null in ReactionListTop component when supportedReactions are not matching', async () => {
    renderMessage(
      {
        hasReactions: false,
        messageContentWidth: 100,
        reactions: [{ count: 1, own: true, type: 'love' }],
      },
      { supportedReactions: [] },
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Reaction List Top')).toBeNull();
    });
  });
});
