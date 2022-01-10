import React, { useEffect } from 'react';
import { View } from 'react-native';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { ChannelsStateProvider } from '../../../../contexts/channelsStateContext/ChannelsStateContext';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateReaction } from '../../../../mock-builders/generator/reaction';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { Message } from '../../Message';
import { MessageContent } from '../../MessageSimple/MessageContent';

describe('MessageContent', () => {
  let channel;
  let chatClient;
  let renderMessage;

  const user = generateUser({ id: 'id', name: 'name' });
  const messages = [generateMessage({ user })];

  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannel({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);

    renderMessage = (options) =>
      render(
        <ChannelsStateProvider>
          <Chat client={chatClient}>
            <Channel channel={channel}>
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

  it('renders the MessageContent component', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
    });
  });

  it('renders an error/unsent message when `message.type` is `error`', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({
      message: { ...message, type: 'error' },
    });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('message-error')).toBeTruthy();
    });
  });

  it('renders a failed/try again message when `message.status` is `failed`', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({
      message: { ...message, status: 'failed' },
    });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('message-error')).toBeTruthy();
    });
  });

  it('renders a message deleted message when `message.type` is `deleted`', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({
      message: { ...message, type: 'deleted' },
    });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('message-deleted')).toBeTruthy();
    });
  });

  it('renders a MessageHeader when the prop exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const ContextMessageHeader = (props) => <View {...props} testID='message-header' />;

    const { getByTestId } = render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} MessageHeader={ContextMessageHeader}>
            <Message groupStyles={['bottom']} message={message} />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('message-header')).toBeTruthy();
    });
  });

  it('renders a MessageFooter when the prop exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const ContextMessageFooter = (props) => <View {...props} testID='message-footer' />;

    const { getByTestId } = render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} MessageFooter={ContextMessageFooter}>
            <Message groupStyles={['bottom']} message={message} />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('message-footer')).toBeTruthy();
    });
  });

  it('renders a time component when MessageFooter does not exist', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId, queryAllByTestId } = renderMessage({
      message,
      MessageFooter: null,
    });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('message-status-time')).toBeTruthy();
      expect(queryAllByTestId('message-footer')).toHaveLength(0);
    });
  });

  it('renders the Gallery when image attachments exist', async () => {
    const user = generateUser();
    const message = generateMessage({
      attachments: [{ image_url: 'https://i.imgur.com/SLx06PP.png', type: 'image' }],
      user,
    });

    const { getByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('image-attachment-single')).toBeTruthy();
    });
  });

  it('renders the GalleryContainer when multiple image attachments exist', async () => {
    const user = generateUser();
    const message = generateMessage({
      attachments: [
        { image_url: 'https://i.imgur.com/SLx06PP.png', type: 'image' },
        { image_url: 'https://i.imgur.com/iNaC3K7.jpg', type: 'image' },
      ],
      user,
    });

    const { getByTestId, queryAllByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('image-multiple-container')).toBeTruthy();
      expect(queryAllByTestId('image-multiple')).toHaveLength(2);
    });
  });

  it('renders the FileAttachment component when a file attachment exists', async () => {
    const user = generateUser();
    const message = generateMessage({
      attachments: [{ title: 'file', type: 'file' }],
      user,
    });

    const { getByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('renders the ReactionList when the message has reactions', async () => {
    const user = generateUser();
    const reaction = generateReaction();
    const message = generateMessage({
      latest_reactions: [reaction],
      user,
    });

    // This needs to be mocked like that cause native onLayout on MessageContent would never
    // trigger.
    const MessageContentWithMockedMessageContentWidth = (props) => {
      useEffect(() => {
        props.setMessageContentWidth(100);
      }, []);
      return <MessageContent {...props} />;
    };

    const { getByTestId } = render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} MessageContent={MessageContentWithMockedMessageContentWidth}>
            <Message groupStyles={['bottom']} message={message} reactionsEnabled />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('reaction-list')).toBeTruthy();
    });
  });
});
