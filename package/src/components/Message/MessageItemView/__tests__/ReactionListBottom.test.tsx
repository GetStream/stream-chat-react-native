import React from 'react';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

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
  let channel: ChannelType;
  let chatClient: StreamChat;
  let renderMessage: (
    options: Omit<React.ComponentProps<typeof Message>, 'groupStyles'> &
      Partial<Pick<React.ComponentProps<typeof Message>, 'groupStyles'>>,
    channelProps?: Partial<React.ComponentProps<typeof Channel>>,
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

    renderMessage = (options, channelProps) =>
      render(
        <Chat client={chatClient}>
          <Channel channel={channel} {...channelProps}>
            <Message groupStyles={['bottom']} {...options} />
          </Channel>
        </Chat>,
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
      reaction_groups: { [reaction.type]: reaction } as unknown as ReturnType<
        typeof generateMessage
      >['reaction_groups'],
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
      reaction_groups: { [reaction.type]: reaction } as unknown as ReturnType<
        typeof generateMessage
      >['reaction_groups'],
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

  // As discussed with Design team, the animation is not needed for now. Once we have it, we can add it.

  // it('applies animation on press in', () => {
  //   const animatedSpy = jest.spyOn(Animated, 'spring');
  //   const user = generateUser();
  //   const reaction = generateReaction();
  //   const message = generateMessage({
  //     reaction_groups: { [reaction.type]: reaction },
  //     user,
  //   });

  //   renderMessage({ message }, { reactionListPosition: 'bottom' });

  //   const reactionListBottomItem = screen.getByLabelText('Reaction List Bottom Item');

  //   fireEvent(reactionListBottomItem, 'onPressIn');

  //   expect(animatedSpy).toHaveBeenCalledWith(expect.any(Animated.Value), {
  //     toValue: 0.8,
  //     useNativeDriver: true,
  //   });
  // });

  // it('applies animation on press out', () => {
  //   const animatedSpy = jest.spyOn(Animated, 'spring');
  //   const user = generateUser();
  //   const reaction = generateReaction();
  //   const message = generateMessage({
  //     reaction_groups: { [reaction.type]: reaction },
  //     user,
  //   });

  //   renderMessage({ message }, { reactionListPosition: 'bottom' });

  //   const reactionListBottomItem = screen.getByLabelText('Reaction List Bottom Item');

  //   fireEvent(reactionListBottomItem, 'onPressOut');

  //   expect(animatedSpy).toHaveBeenCalledWith(expect.any(Animated.Value), {
  //     toValue: 1,
  //     useNativeDriver: true,
  //   });
  // });

  it('does not toggle the reaction on press but opens the reactions bottom sheet instead', () => {
    // Tapping a segmented reaction must mirror the clustered flow: it opens the
    // reactions bottom sheet (preselecting the tapped reaction) rather than
    // adding/removing the current user's reaction.
    const handleReactionMock = jest.fn();
    const user = generateUser();
    const reaction = generateReaction();
    const message = generateMessage({
      reaction_groups: { [reaction.type]: reaction } as unknown as ReturnType<
        typeof generateMessage
      >['reaction_groups'],
      user,
    });

    renderMessage(
      {
        handleReaction: handleReactionMock,
        message,
      } as unknown as React.ComponentProps<typeof Message>,
      { reactionListPosition: 'bottom', reactionListType: 'segmented' },
    );

    const reactionListBottomItem = screen.getByTestId('reaction-list-item');

    fireEvent(reactionListBottomItem, 'onPress');

    expect(handleReactionMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText('User Reactions on long press message')).toBeTruthy();
  });

  it('exposes the pressed reaction type via onPressMessage so integrators can toggle', () => {
    // Integrators that want the old toggle-on-tap behavior can intercept the
    // `reactionList` emitter and call `actionHandlers.toggleReaction(reactionType)`.
    const onPressMessageMock = jest.fn();
    const user = generateUser();
    const reaction = generateReaction();
    const message = generateMessage({
      reaction_groups: { [reaction.type]: reaction } as unknown as ReturnType<
        typeof generateMessage
      >['reaction_groups'],
      user,
    });

    renderMessage(
      { message },
      {
        onPressMessage: onPressMessageMock,
        reactionListPosition: 'bottom',
        reactionListType: 'segmented',
      },
    );

    const reactionListBottomItem = screen.getByTestId('reaction-list-item');

    fireEvent(reactionListBottomItem, 'onPress');

    expect(onPressMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        additionalInfo: { reactionType: reaction.type },
        emitter: 'reactionList',
      }),
    );
    // onPressMessage replaces the default handler, so the sheet must NOT open here.
    expect(screen.queryByLabelText('User Reactions on long press message')).toBeNull();
  });
});
