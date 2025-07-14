import React from 'react';

import { Alert } from 'react-native';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { MessageComposer } from 'stream-chat';

import * as AttachmentPickerUtils from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import * as UseMessageComposerHooks from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';

import { generateLocalFileUploadAttachmentData } from '../../../mock-builders/attachments';

import { generateMessage } from '../../../mock-builders/generator/message';

import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageInput } from '../MessageInput';

jest.spyOn(Alert, 'alert');
jest.spyOn(AttachmentPickerUtils, 'useAttachmentPickerContext').mockImplementation(
  jest.fn(() => ({
    closePicker: jest.fn(),
    openPicker: jest.fn(),
    selectedPicker: 'images',
    setBottomInset: jest.fn(),
    setSelectedPicker: jest.fn(),
    setTopInset: jest.fn(),
  })),
);

const renderComponent = ({ channelProps, client, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel {...channelProps}>
          <MessageInput {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

const editedMessageSetup = async ({ composerConfig, composition } = {}) => {
  const { client: chatClient, channels } = await initiateClientWithChannels();
  const channel = channels[0];

  const messageComposer = new MessageComposer({
    client: chatClient,
    composition,
    compositionContext: composition,
    config: composerConfig,
  });

  messageComposer.registerSubscriptions();
  jest.spyOn(UseMessageComposerHooks, 'useMessageComposer').mockReturnValue(messageComposer);

  return { channel, chatClient, messageComposer };
};

describe('SendMessageDisallowedIndicator', () => {
  let client;
  let channel;

  beforeEach(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
    act(() => {
      channel.messageComposer.clear();
    });
  });

  it('should render the SendMessageDisallowedIndicator if the send-message capability is not present', async () => {
    const props = {};
    const channelProps = { audioRecordingEnabled: true, channel };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeNull();
    });

    act(() => {
      client.dispatchEvent({
        cid: channel.data.cid,
        own_capabilities: channel.data.own_capabilities.filter(
          (capability) => capability !== 'send-message',
        ),
        type: 'capabilities.changed',
      });
    });

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeTruthy();
    });
  });

  it('should not render the SendMessageDisallowedIndicator if the channel is frozen and the send-message capability is present', async () => {
    const props = {};
    const channelProps = { channel };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeNull();
    });
  });

  it('should render the SendMessageDisallowedIndicator in a frozen channel only if the send-message capability is not present', async () => {
    const props = {};
    const channelProps = { channel };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    act(() => {
      client.dispatchEvent({
        channel: {
          ...channel.data,
          own_capabilities: channel.data.own_capabilities.filter(
            (capability) => capability !== 'send-message',
          ),
        },
        cid: channel.data.cid,
        type: 'channel.updated',
      });
    });

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeTruthy();
    });
  });
});

describe("SendMessageDisallowedIndicator's edited state", () => {
  it('should not render the SendMessageDisallowedIndicator if we are editing a message, regardless of capabilities', async () => {
    const message = generateMessage({
      attachments: [generateLocalFileUploadAttachmentData()],
      cid: 'messaging:channel-id',
      text: 'test',
    });

    const { channel: customChannel, chatClient } = await editedMessageSetup({
      composition: message,
    });

    await renderComponent({
      channelProps: { channel: customChannel },
      client: chatClient,
      props: {},
    });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeNull();
    });

    act(() => {
      chatClient.dispatchEvent({
        cid: customChannel.data.cid,
        own_capabilities: customChannel.data.own_capabilities.filter(
          (capability) => capability !== 'send-message',
        ),
        type: 'capabilities.changed',
      });
    });

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeNull();
    });
  });
});
