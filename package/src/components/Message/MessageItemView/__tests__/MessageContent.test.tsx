import React from 'react';
import { StyleSheet, View } from 'react-native';

import { cleanup, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { ChannelsStateProvider } from '../../../../contexts/channelsStateContext/ChannelsStateContext';
import { WithComponents } from '../../../../contexts/componentsContext/ComponentsContext';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import {
  generateAttachmentAction,
  generateGiphyAttachment,
  generateVideoAttachment,
} from '../../../../mock-builders/generator/attachment';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateReaction } from '../../../../mock-builders/generator/reaction';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { Message } from '../../Message';

describe('MessageContent', () => {
  let channel: ChannelType;
  let chatClient: StreamChat;
  let renderMessage: (
    options: Omit<React.ComponentProps<typeof Message>, 'groupStyles'> &
      Partial<Pick<React.ComponentProps<typeof Message>, 'groupStyles'>>,
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

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
    });
  });

  it('renders an error/unsent message when `message.type` is `error`', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({
      message: { ...message, type: 'error' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('message-error')).toBeTruthy();
    });
  });

  it('renders a failed/try again message when `message.status` is `failed`', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({
      message: { ...message, status: 'failed' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('message-error')).toBeTruthy();
    });
  });

  it('renders a message deleted message when `message.type` is `deleted`', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({
      message: { ...message, type: 'deleted' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('message-deleted')).toBeTruthy();
    });
  });

  it('renders a MessageHeader when the prop exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const ContextMessageHeader = (props: Record<string, unknown>) => (
      <View {...props} testID='message-header' />
    );

    render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <WithComponents overrides={{ MessageHeader: ContextMessageHeader }}>
            <Channel channel={channel}>
              <Message groupStyles={['bottom']} message={message} />
            </Channel>
          </WithComponents>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('message-header')).toBeTruthy();
    });
  });

  it('renders a MessageFooter when the prop exists', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const ContextMessageFooter = (props: Record<string, unknown>) => (
      <View {...props} testID='message-footer' />
    );

    render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <WithComponents overrides={{ MessageFooter: ContextMessageFooter }}>
            <Channel channel={channel}>
              <Message groupStyles={['bottom']} message={message} />
            </Channel>
          </WithComponents>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('message-footer')).toBeTruthy();
    });
  });

  it('renders MessageContentTopView and MessageContentBottomView when provided', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <WithComponents
            overrides={{
              MessageContentBottomView: () => <View testID='message-content-bottom-view' />,
              MessageContentTopView: () => <View testID='message-content-top-view' />,
            }}
          >
            <Channel channel={channel}>
              <Message groupStyles={['bottom']} message={message} />
            </Channel>
          </WithComponents>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('message-content-top-view')).toBeTruthy();
      expect(screen.getByTestId('message-content-bottom-view')).toBeTruthy();
    });
  });

  it('renders MessageContentLeadingView and MessageContentTrailingView when provided', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <WithComponents
            overrides={{
              MessageContentLeadingView: () => <View testID='message-content-leading-view' />,
              MessageContentTrailingView: () => <View testID='message-content-trailing-view' />,
            }}
          >
            <Channel channel={channel}>
              <Message groupStyles={['bottom']} message={message} />
            </Channel>
          </WithComponents>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('message-content-leading-view')).toBeTruthy();
      expect(screen.getByTestId('message-content-trailing-view')).toBeTruthy();
    });
  });

  it('orders leading and trailing content views based on alignment', async () => {
    const otherUser = generateUser({ id: 'other-user' });
    const leftAlignedMessage = generateMessage({ user: otherUser });
    const rightAlignedMessage = generateMessage({ user });

    const { rerender } = render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <WithComponents
            overrides={{
              MessageContentLeadingView: () => <View testID='message-content-leading-view' />,
              MessageContentTrailingView: () => <View testID='message-content-trailing-view' />,
            }}
          >
            <Channel channel={channel}>
              <Message groupStyles={['bottom']} message={leftAlignedMessage} />
            </Channel>
          </WithComponents>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-content-leading-view')).toBeTruthy();
      expect(screen.getByTestId('message-content-trailing-view')).toBeTruthy();
    });

    let contentRowStyle = StyleSheet.flatten(screen.getByTestId('message-content-row').props.style);
    expect(contentRowStyle?.flexDirection).toBe('row');

    rerender(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <WithComponents
            overrides={{
              MessageContentLeadingView: () => <View testID='message-content-leading-view' />,
              MessageContentTrailingView: () => <View testID='message-content-trailing-view' />,
            }}
          >
            <Channel channel={channel}>
              <Message groupStyles={['bottom']} message={rightAlignedMessage} />
            </Channel>
          </WithComponents>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-content-leading-view')).toBeTruthy();
      expect(screen.getByTestId('message-content-trailing-view')).toBeTruthy();
    });

    contentRowStyle = StyleSheet.flatten(screen.getByTestId('message-content-row').props.style);
    expect(contentRowStyle?.flexDirection).toBe('row-reverse');
  });

  it('renders a time component when MessageFooter does not exist', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('message-status-time')).toBeTruthy();
      expect(screen.queryAllByTestId('message-footer')).toHaveLength(0);
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

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('gallery-container')).toBeTruthy();
    });
  });

  it('removes content padding for a single video attachment', async () => {
    const user = generateUser();
    const message = generateMessage({
      attachments: [
        generateVideoAttachment({
          original_height: 300,
          original_width: 600,
        }),
      ],
      html: '',
      text: '',
      user,
    });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('gallery-container')).toBeTruthy();
    });

    const galleryContainer = screen.getByTestId('gallery-container');
    let ancestor = galleryContainer.parent;
    let contentContainerStyle;

    while (ancestor && !contentContainerStyle) {
      const flattenedStyle = StyleSheet.flatten(ancestor.props.style);
      if (
        flattenedStyle &&
        'paddingTop' in flattenedStyle &&
        'paddingHorizontal' in flattenedStyle &&
        'paddingBottom' in flattenedStyle
      ) {
        contentContainerStyle = flattenedStyle;
        break;
      }
      ancestor = ancestor.parent;
    }

    expect(contentContainerStyle).toBeTruthy();
    expect(contentContainerStyle.paddingTop).toBe(0);
    expect(contentContainerStyle.paddingHorizontal).toBe(0);
    expect(contentContainerStyle.paddingBottom).toBe(0);
  });

  it('keeps content padding for a quoted reply with a giphy attachment', async () => {
    const user = generateUser();
    const message = generateMessage({
      attachments: [generateGiphyAttachment()],
      quoted_message: generateMessage({ text: 'quoted message', user }),
      text: '',
      user,
    });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByTestId('giphy-attachment')).toBeTruthy();
    });

    const giphyAttachment = screen.getByTestId('giphy-attachment');
    let ancestor = giphyAttachment.parent;
    let contentContainerStyle;

    while (ancestor && !contentContainerStyle) {
      const flattenedStyle = StyleSheet.flatten(ancestor.props.style);
      if (
        flattenedStyle &&
        'paddingTop' in flattenedStyle &&
        'paddingHorizontal' in flattenedStyle &&
        'paddingBottom' in flattenedStyle
      ) {
        contentContainerStyle = flattenedStyle;
        break;
      }
      ancestor = ancestor.parent;
    }

    expect(contentContainerStyle).toBeTruthy();
    expect(contentContainerStyle.paddingTop).toBeGreaterThan(0);
    expect(contentContainerStyle.paddingHorizontal).toBeGreaterThan(0);
    expect(contentContainerStyle.paddingBottom).toBeGreaterThan(0);
  });

  it('does not render the quoted reply for an ephemeral giphy preview', async () => {
    const user = generateUser();
    const message = generateMessage({
      attachments: [
        {
          ...generateGiphyAttachment(),
          actions: [
            generateAttachmentAction(),
            generateAttachmentAction(),
            generateAttachmentAction(),
          ],
        },
      ],
      quoted_message: generateMessage({ text: 'quoted message', user }),
      text: '',
      user,
    });

    renderMessage({ message });

    await waitFor(() => {
      expect(screen.getByTestId('giphy-action-attachment')).toBeTruthy();
    });

    expect(screen.queryByText('quoted message')).toBeFalsy();
  });

  it('renders the FileAttachment component when a file attachment exists', async () => {
    const user = generateUser();
    const message = generateMessage({
      attachments: [
        { title: 'file', type: 'file' },
        { title: 'audio', type: 'audio' },
        { title: 'video', type: 'video' },
      ],
      user,
    });

    renderMessage({ message });

    const fileAttachments = screen.queryAllByTestId('file-attachment');
    const audioAttachments = screen.queryAllByLabelText('audio-attachment-preview');

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(fileAttachments).toHaveLength(1);
      expect(audioAttachments).toHaveLength(1);
    });
  });

  it('renders the ReactionList when the message has reactions', async () => {
    const user = generateUser();
    const reaction = generateReaction();
    const message = generateMessage({
      reaction_groups: { [reaction.type]: reaction } as unknown as ReturnType<
        typeof generateMessage
      >['reaction_groups'],
      user,
    });

    render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <Message groupStyles={['bottom']} message={message} />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-content-wrapper')).toBeTruthy();
      expect(screen.getByLabelText('Reaction List Top')).toBeTruthy();
    });
  });
});
