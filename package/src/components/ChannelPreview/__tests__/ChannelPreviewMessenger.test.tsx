import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import truncate from 'lodash/truncate';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelPreviewMessenger } from '../ChannelPreviewMessenger';
import type { Channel, MessageResponse, StreamChat } from 'stream-chat';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../../contexts/translationContext/TranslationContext';
import type { ChannelPreviewMessageProps } from 'stream-chat-react-native';

describe('ChannelPreviewMessenger', () => {
  const clientUser = generateUser();
  let chatClient: StreamChat;
  let channel: Channel | null;

  const getComponent = (props = {}) => (
    <Chat client={chatClient}>
      <ChannelPreviewMessenger
        channel={channel as Channel}
        latestMessagePreview={{
          created_at: '',
          messageObject: generateMessage() as MessageResponse,
          previews: [
            {
              bold: true,
              text: 'This is the message preview text',
            },
          ],
          status: 0 | 1 | 2, // read states of latest message.
        }}
        onSelect={jest.fn()}
        {...props}
      />
    </Chat>
  );

  const initializeChannel = async (channelWithOverrides: Channel) => {
    useMockedApis(chatClient, [getOrCreateChannelApi(channelWithOverrides)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  afterEach(() => {
    channel = null;
  });

  it('should call setActiveChannel on click', async () => {
    const onSelect = jest.fn();
    await initializeChannel(generateChannelResponse() as unknown as Channel);

    const { getByTestId } = render(
      getComponent({
        onSelect,
        watchers: {},
      }),
    );

    await waitFor(() => getByTestId('channel-preview-button'));
    fireEvent.press(getByTestId('channel-preview-button'));

    await waitFor(() => {
      // eslint-disable-next-line jest/prefer-called-with
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  it('should render name of channel', async () => {
    const channelName = Date.now().toString();
    await initializeChannel(
      generateChannelResponse({
        channel: {
          name: channelName,
        },
      }),
    );
    const { queryByText } = render(getComponent());
    await waitFor(() => queryByText(channelName));
  });

  it('should render comma separated names of other members, if channel has no name', async () => {
    const m1 = generateMember();
    const m2 = generateMember();
    const m3 = generateMember();

    await initializeChannel(
      generateChannelResponse({
        channel: {
          members: [m1, m2, m3],
        },
      }) as unknown as Channel,
    );

    const { queryByText } = render(getComponent());
    const expectedDisplayName = `${m1.user.name}, ${m2.user.name}, ${m3.user.name}`;

    await waitFor(() => queryByText(expectedDisplayName));
  });

  it('should render latest message, truncated to length given by latestMessageLength', async () => {
    const message = generateMessage();
    await initializeChannel(generateChannelResponse() as unknown as Channel);

    const { queryByText } = render(
      getComponent({
        latestMessage: message,
        latestMessageLength: 6,
      }),
    );

    const expectedMessagePreview = truncate(message.text, { length: 6 });
    await waitFor(() => queryByText(expectedMessagePreview));
  });
});
