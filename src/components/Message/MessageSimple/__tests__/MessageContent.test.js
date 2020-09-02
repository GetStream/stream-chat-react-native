import React, { useContext } from 'react';
import { View } from 'react-native';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@stream-io/styled-components';

import { generateChannel } from 'mock-builders/generator/channel';
import { generateMember } from 'mock-builders/generator/member';
import { getOrCreateChannelApi } from 'mock-builders/api/getOrCreateChannel';
import { useMockedApis } from 'mock-builders/api/useMockedApis';
import { generateMessage } from 'mock-builders/generator/message';
import { generateStaticUser, generateUser } from 'mock-builders/generator/user';
import { getTestClientWithUser } from 'mock-builders/mock';

import MessageContent from '../MessageContent';
import MessageSimple from '../MessageSimple';
import Message from '../../Message';
import Chat from '../../../Chat/Chat';
import Channel from '../../../Channel/Channel';
import MessageList from '../../../MessageList/MessageList';
import { ChatContext, MessageContentContext } from '../../../../context';
import { Streami18n } from '../../../../utils/Streami18n';
import { defaultTheme } from '../../../../styles/theme';

const MessageContentContextConsumer = ({ fn }) => {
  fn(useContext(MessageContentContext));
  // fn(useContext(ChatContext));
  return <View testID='children' />;
};

let channel;
let chatClient;

const user = generateUser({ id: 'id', name: 'name' });
const messages = [generateMessage({ user })];

/**
 * MessageContent
 * - it should show the action sheet on long press
 * - it should edit a message
 * - it should delete a message
 * - it should render the deleted message text component
 * - it should open a thread
 * - it should open the reaction picker
 * - it shows the time if a MessageFooter doesn't exist
 * MessageContentContext
 *  - it renders children without crashing
 *  - it exposes the message content context
 *  - it updates the context when props change
 */

describe('MessageContent', () => {
  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannel({
      members,
      messages,
    });
    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('renders Message, MessageSimple, and MessageContent', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message groupStyles={['bottom']} message={message} />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-simple-wrapper')).toBeTruthy();
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
    });
  });
  it('renders an error/unsent message when `message.type` is `error`', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message
            groupStyles={['bottom']}
            message={{ ...message, type: 'error' }}
          />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-error')).toBeTruthy();
    });
  });

  it('renders a failed/try again message when `message.status` is `failed`', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message
            groupStyles={['bottom']}
            message={{ ...message, status: 'failed' }}
          />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-failed')).toBeTruthy();
    });
  });

  it('renders a message deleted message when `message.deleted_at` exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message
            groupStyles={['bottom']}
            message={{ ...message, deleted_at: true }}
          />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-deleted')).toBeTruthy();
    });
  });
  it('renders a MessageHeader when the prop exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message
            groupStyles={['bottom']}
            message={message}
            MessageHeader={(props) => <View {...props} />}
          />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-header')).toBeTruthy();
    });
  });

  it('renders a MessageFooter when the prop exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message
            groupStyles={['bottom']}
            message={message}
            MessageFooter={(props) => <View {...props} />}
          />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-footer')).toBeTruthy();
    });
  });

  it('renders a time component when MessageFooter does not exist', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId, queryAllByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message
            groupStyles={['bottom']}
            message={message}
            MessageFooter={null}
          />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('show-time')).toBeTruthy();
      expect(queryAllByTestId('message-footer')).toHaveLength(0);
    });
  });

  it('renders the Gallery when image attachments exist', async () => {
    const user = generateUser();
    const message = generateMessage({
      attachments: [
        { image_url: 'https://i.imgur.com/SLx06PP.png', type: 'image' },
      ],
      user,
    });

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message groupStyles={['bottom']} message={message} />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
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

    const { getByTestId, queryAllByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message groupStyles={['bottom']} message={message} />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
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

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message groupStyles={['bottom']} message={message} />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });
});

/* <MessageContent groupStyles={['bottom']} onLongPress={onLongPress}>
        <MessageContentContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        ></MessageContentContextConsumer>
      </MessageContent>
    */
