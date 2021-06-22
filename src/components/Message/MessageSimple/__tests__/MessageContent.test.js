import React from 'react';
import { View } from 'react-native';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { Message } from '../../Message';

import { Chat } from '../../../Chat/Chat';
import { Channel } from '../../../Channel/Channel';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateReaction } from '../../../../mock-builders/generator/reaction';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';

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
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <Message groupStyles={['bottom']} {...options} />
          </Channel>
        </Chat>,
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
      expect(getByTestId('message-failed')).toBeTruthy();
    });
  });

  it('renders a message deleted message when `message.deleted_at` exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({
      message: { ...message, deleted_at: true },
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-deleted')).toBeTruthy();
    });
  });

  it('renders a MessageHeader when the prop exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({
      message,
      // eslint-disable-next-line react/display-name
      MessageHeader: (props) => <View {...props} />,
    });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('message-header')).toBeTruthy();
    });
  });

  it('renders a MessageFooter when the prop exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({
      message,
      // eslint-disable-next-line react/display-name
      MessageFooter: (props) => <View {...props} />,
    });

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
      expect(getByTestId('show-time')).toBeTruthy();
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

    const { getByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(getByTestId('reaction-list')).toBeTruthy();
    });
  });
});
