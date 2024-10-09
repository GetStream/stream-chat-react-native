import React from 'react';

import { Animated } from 'react-native';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ChannelsStateProvider } from '../../../../contexts/channelsStateContext/ChannelsStateContext';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateReaction } from '../../../../mock-builders/generator/reaction';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { Message } from '../../Message';

describe('ReactionListBottom', () => {
  let channel;
  let chatClient;
  let renderMessage;

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
    channel = chatClient.channel('messaging', mockedChannel.id);

    renderMessage = (options, channelProps) =>
      render(
        <ChannelsStateProvider>
          <Chat client={chatClient}>
            <Channel channel={channel} {...channelProps}>
              <Message groupStyles={['bottom']} {...options} />
            </Channel>
          </Chat>
        </ChannelsStateProvider>,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('renders the ReactionListBottom component', async () => {
    const user = generateUser();
    const reaction = generateReaction();
    const message = generateMessage({
      reaction_groups: { [reaction.type]: reaction },
      user,
    });

    renderMessage({ message }, { reactionListPosition: 'bottom' });

    await waitFor(() => {
      expect(screen.getByLabelText('Reaction List Bottom')).toBeTruthy();
    });
  });

  it('renders null when no supported reaction', async () => {
    const user = generateUser();
    const reaction = generateReaction();
    const message = generateMessage({
      reaction_groups: { [reaction.type]: reaction },
      user,
    });

    renderMessage({ message }, { reactionListPosition: 'bottom', supportedReactions: [] });

    await waitFor(() => {
      expect(screen.queryByLabelText('Reaction List Bottom')).toBeNull();
    });
  });

  it('renders null when no hasReactions false', async () => {
    const user = generateUser();
    const message = generateMessage({
      reaction_groups: {},
      user,
    });

    renderMessage({ hasReactions: false, message }, { reactionListPosition: 'bottom' });

    await waitFor(() => {
      expect(screen.queryByLabelText('Reaction List Bottom')).toBeNull();
    });
  });

  it('applies animation on press in', () => {
    const animatedSpy = jest.spyOn(Animated, 'spring');
    const user = generateUser();
    const reaction = generateReaction();
    const message = generateMessage({
      reaction_groups: { [reaction.type]: reaction },
      user,
    });

    renderMessage({ message }, { reactionListPosition: 'bottom' });

    const reactionListBottomItem = screen.getByLabelText('Reaction List Bottom Item');

    fireEvent(reactionListBottomItem, 'onPressIn');

    expect(animatedSpy).toHaveBeenCalledWith(expect.any(Animated.Value), {
      toValue: 0.8,
      useNativeDriver: true,
    });
  });

  it('applies animation on press out', () => {
    const animatedSpy = jest.spyOn(Animated, 'spring');
    const user = generateUser();
    const reaction = generateReaction();
    const message = generateMessage({
      reaction_groups: { [reaction.type]: reaction },
      user,
    });

    renderMessage({ message }, { reactionListPosition: 'bottom' });

    const reactionListBottomItem = screen.getByLabelText('Reaction List Bottom Item');

    fireEvent(reactionListBottomItem, 'onPressOut');

    expect(animatedSpy).toHaveBeenCalledWith(expect.any(Animated.Value), {
      toValue: 1,
      useNativeDriver: true,
    });
  });

  it('call handleReaction on press', () => {
    const handleReactionMock = jest.fn();
    const user = generateUser();
    const reaction = generateReaction();
    const message = generateMessage({
      reaction_groups: { [reaction.type]: reaction },
      user,
    });

    renderMessage(
      {
        handleReaction: handleReactionMock,
        message,
      },
      { reactionListPosition: 'bottom' },
    );

    const reactionListBottomItem = screen.getByLabelText('Reaction List Bottom Item');

    fireEvent(reactionListBottomItem, 'onPress');

    expect(handleReactionMock).toHaveBeenCalledTimes(1);
  });
});
