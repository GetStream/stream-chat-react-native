import React from 'react';

import { Text } from 'react-native';

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
import { Message } from '../../Message';

describe('MessageSimple', () => {
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

  it('renders the MessageSimple component', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('message-simple-wrapper')).toBeTruthy();
    });
  });

  it('renders MessageAvatar when alignment is left', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.queryByTestId('message-avatar')).toBeDefined();
    });
  });

  it('do not renders MessageAvatar when alignment is right', async () => {
    const user = generateUser({ id: 'id', name: 'name' });
    const message = generateMessage({ user });
    renderMessage({ message });

    await waitFor(() => {
      expect(screen.queryByTestId('message-avatar')).toBeNull();
    });
  });

  it('renders MessageDeleted when message type is deleted', async () => {
    const user = generateUser();
    const message = generateMessage({ type: 'deleted', user });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.queryByTestId('message-deleted')).toBeDefined();
    });
  });

  it('renders MessageContent when message is not deleted', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.queryByTestId('message-components')).toBeDefined();
    });
  });

  it('renders ReactionListTop when reactionListPosition is top', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({ message }, { reactionListPosition: 'top' });

    await waitFor(() => {
      expect(screen.queryByLabelText('Reaction List Top')).toBeDefined();
      expect(screen.queryByLabelText('Reaction List Bottom')).toBeNull();
    });
  });

  it('renders ReactionListBottom when reactionListPosition is bottom', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({ message }, { reactionListPosition: 'bottom' });

    await waitFor(() => {
      expect(screen.queryByLabelText('Reaction List Top')).toBeNull();
      expect(screen.queryByLabelText('Reaction List Bottom')).toBeDefined();
    });
  });

  it('renders MessagePinnedHeader when message is pinned', async () => {
    const user = generateUser();
    const message = generateMessage({ pinned: true, user });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.queryByLabelText('Message Pinned Header')).not.toBeNull();
    });
  });

  it('renders MessageHeader component if defined', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({ message }, { MessageHeader: () => <Text>Message Header</Text> });

    await waitFor(() => {
      expect(screen.queryByText('Message Header')).not.toBeNull();
    });
  });

  it('applies correct styles for when group styles are not single or bottom', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({ groupStyles: ['top'], message });

    await waitFor(() => {
      expect(screen.getByTestId('message-simple-wrapper').props.style[1]).toMatchObject({});
    });
  });

  it('applies correct styles for when group styles are single/bottom and not last message', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('message-simple-wrapper').props.style[1]).toMatchObject({
        marginBottom: 8,
      });
    });
  });

  it('noBorder true when only emojis text', async () => {
    const user = generateUser();
    const message = generateMessage({ quoted_message: undefined, text: '😊', user });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper').props.style[2]).toMatchObject({
        borderWidth: 0,
      });
    });
  });

  it('noBorder true when only other attachments is present', async () => {
    const user = generateUser();
    const message = generateMessage({ attachments: [{ title: 'other', type: 'other' }], user });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper').props.style[2]).toMatchObject({
        borderWidth: 0,
      });
    });
  });
});
