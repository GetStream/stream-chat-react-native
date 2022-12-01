import React from 'react';

import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react-native';

import { MessageProvider } from '../../../contexts/messageContext/MessageContext';
import { MessagesProvider } from '../../../contexts/messagesContext/MessagesContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateGiphyAttachment } from '../../../mock-builders/generator/attachment';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { ImageLoadingFailedIndicator } from '../../Attachment/ImageLoadingFailedIndicator';
import { ImageLoadingIndicator } from '../../Attachment/ImageLoadingIndicator';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageList } from '../../MessageList/MessageList';
import { Giphy } from '../Giphy';

describe('Giphy', () => {
  const getAttachmentComponent = (props) => {
    const message = generateMessage();
    return (
      <ThemeProvider>
        <MessagesProvider value={{ ImageLoadingFailedIndicator, ImageLoadingIndicator }}>
          <MessageProvider value={{ message }}>
            <Giphy {...props} />
          </MessageProvider>
        </MessagesProvider>
      </ThemeProvider>
    );
  };
  let chatClient;
  let channel;
  let attachment;

  const actions = [
    { name: 'image_action', text: 'Send', value: 'send' },
    { name: 'image_action', text: 'Shuffle', value: 'shuffle' },
    {
      name: 'image_action',
      text: 'Cancel',
      value: 'cancel',
    },
  ];

  const giphy = {
    fixed_height: {
      height: '200',
      url: 'https://media1.giphy.com/media/test/fixed_height.gif',
      width: '375',
    },
    original: {
      height: '256',
      url: 'https://media1.giphy.com/media/test/original.gif',
      width: '480',
    },
  };
  const initChannel = async () => {
    const user1 = generateUser();
    attachment = generateGiphyAttachment();

    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [
        generateMessage({ user: user1 }),
        generateMessage({ type: 'system', user: undefined }),
        generateMessage({ attachments: [{ ...attachment }], user: user1 }),
      ],
    });

    chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();
  };

  beforeEach(async () => {
    await initChannel();
  });

  afterEach(cleanup);

  it('should render Card component for "imgur" type attachment', async () => {
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('giphy-attachment')).toBeTruthy();
    });
  });

  it('should render Card component for "giphy" type attachment', async () => {
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('giphy-attachment')).toBeTruthy();
    });
  });

  it('"giphy" attachment size should be customisable', async () => {
    attachment.giphy = giphy;
    const { getByTestId: getByTestIdFixedHeight } = render(
      getAttachmentComponent({ attachment, giphyVersion: 'fixed_height' }),
    );
    const { getByTestId: getByTestIdOriginal } = render(
      getAttachmentComponent({ attachment, giphyVersion: 'original' }),
    );
    await waitFor(() => {
      const checkImageProps = (imageProps, specificSizedGiphyData) => {
        let imageStyle = imageProps.style;
        if (Array.isArray(imageStyle)) {
          imageStyle = Object.assign({}, ...imageStyle);
        }
        expect(imageStyle.height).toBe(parseFloat(specificSizedGiphyData.height));
        expect(imageStyle.width).toBe(parseFloat(specificSizedGiphyData.width));
        expect(imageProps.source.uri).toBe(specificSizedGiphyData.url);
      };
      checkImageProps(
        getByTestIdFixedHeight('giphy-attachment-image').props,
        attachment.giphy.fixed_height,
      );
      checkImageProps(
        getByTestIdOriginal('giphy-attachment-image').props,
        attachment.giphy.original,
      );
    });
  });

  it('show render giphy action UI and all the 3 action buttons', async () => {
    attachment.actions = actions;
    const { getByTestId } = render(
      getAttachmentComponent({ attachment, giphyVersion: 'fixed_height' }),
    );

    await waitFor(() => {
      expect(getByTestId('giphy-action-attachment')).toBeTruthy();
      expect(getByTestId('cancel-action-button')).toBeTruthy();
      expect(getByTestId('shuffle-action-button')).toBeTruthy();
      expect(getByTestId('send-action-button')).toBeTruthy();
    });
  });

  it('should trigger the cancel giphy action', async () => {
    const handleAction = jest.fn();
    attachment.actions = actions;
    const { getByTestId } = render(
      getAttachmentComponent({
        attachment,
        giphyVersion: 'fixed_height',
        handleAction,
      }),
    );

    await waitFor(() => getByTestId(`${attachment.actions[2].value}-action-button`));

    expect(getByTestId('giphy-action-attachment')).toContainElement(
      getByTestId(`${attachment.actions[2].value}-action-button`),
    );

    fireEvent.press(getByTestId(`${attachment.actions[2].value}-action-button`));

    await waitFor(() => {
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  it('should trigger the shuffle giphy action', async () => {
    const handleAction = jest.fn();
    attachment.actions = actions;
    const { getByTestId } = render(
      getAttachmentComponent({
        attachment,
        giphyVersion: 'fixed_height',
        handleAction,
      }),
    );

    await waitFor(() => getByTestId(`${attachment.actions[1].value}-action-button`));

    expect(getByTestId('giphy-action-attachment')).toContainElement(
      getByTestId(`${attachment.actions[1].value}-action-button`),
    );

    fireEvent.press(getByTestId(`${attachment.actions[1].value}-action-button`));

    await waitFor(() => {
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  it('should trigger the send giphy action', async () => {
    const handleAction = jest.fn();
    attachment.actions = actions;
    const { getByTestId } = render(
      getAttachmentComponent({
        attachment,
        giphyVersion: 'fixed_height',
        handleAction,
      }),
    );

    await waitFor(() => getByTestId(`${attachment.actions[0].value}-action-button`));

    expect(getByTestId('giphy-action-attachment')).toContainElement(
      getByTestId(`${attachment.actions[0].value}-action-button`),
    );

    fireEvent.press(getByTestId(`${attachment.actions[0].value}-action-button`));

    await waitFor(() => {
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  it('giphy attachment UI should render within the message list with actions', async () => {
    const user1 = generateUser();
    attachment.actions = actions;
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [
        generateMessage({ user: user1 }),
        generateMessage({ type: 'system', user: undefined }),
        generateMessage({ attachments: [{ ...attachment }], user: user1 }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    const { getByTestId, queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('giphy-action-attachment')).toBeTruthy();
      expect(getByTestId('cancel-action-button')).toBeTruthy();
      expect(getByTestId('shuffle-action-button')).toBeTruthy();
      expect(getByTestId('send-action-button')).toBeTruthy();
    });
  });

  it('giphy attachment UI should render within the message list', async () => {
    const { queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('giphy-attachment')).toBeTruthy();
    });
  });

  it('should render a error indicator in giphy image', async () => {
    const { getByA11yLabel, getByAccessibilityHint, queryByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(queryByTestId('giphy-attachment')).toBeTruthy();
    });

    fireEvent(getByA11yLabel('Giphy Attachment Image'), 'error');
    expect(getByAccessibilityHint('image-loading-error')).toBeTruthy();
  });

  it('should render a loading indicator in giphy image and when successful render the image', async () => {
    const { getByA11yLabel, getByAccessibilityHint } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(getByAccessibilityHint('image-loading')).toBeTruthy();
    });

    fireEvent(getByA11yLabel('Giphy Attachment Image'), 'onLoadStart');

    expect(getByAccessibilityHint('image-loading')).toBeTruthy();

    fireEvent(getByA11yLabel('Giphy Attachment Image'), 'onLoadFinish');

    waitForElementToBeRemoved(() => getByAccessibilityHint('image-loading'));
    expect(getByA11yLabel('Giphy Attachment Image')).toBeTruthy();
  });
});
