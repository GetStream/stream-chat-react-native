import React from 'react';

import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import { Chat } from '../../../components';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';

import { generateLocalFileUploadAttachmentData } from '../../../mock-builders/attachments';
import { generateMessage } from '../../../mock-builders/generator/message';
import * as UseMessageComposerAPIContext from '../../messageComposerContext/MessageComposerAPIContext';

import { MessageComposerAPIContextValue } from '../../messageComposerContext/MessageComposerAPIContext';
import { MessageComposerProvider } from '../../messageComposerContext/MessageComposerContext';
import {
  OwnCapabilitiesContextValue,
  OwnCapabilitiesProvider,
} from '../../ownCapabilitiesContext/OwnCapabilitiesContext';
import {
  InputMessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';

const Wrapper = ({ messageComposerContextValue, client, props }) => {
  return (
    <Chat client={client}>
      <OwnCapabilitiesProvider value={{ sendMessage: true } as OwnCapabilitiesContextValue}>
        <MessageComposerProvider value={messageComposerContextValue}>
          <MessageInputProvider
            value={
              {
                ...props,
              } as InputMessageInputContextValue
            }
          >
            {props.children}
          </MessageInputProvider>
        </MessageComposerProvider>
      </OwnCapabilitiesProvider>
    </Chat>
  );
};

describe("MessageInputContext's sendMessage", () => {
  let channel;
  let chatClient;

  beforeEach(async () => {
    const { client, channels } = await initiateClientWithChannels();
    channel = channels[0];
    chatClient = client;
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
    channel.messageComposer.clear();
  });

  it('should get into the catch block if the message composer compose throws an error', async () => {
    const sendMessageMock = jest.fn();
    const initialProps = {
      sendMessage: sendMessageMock,
    };
    const consoleErrorMock = jest.spyOn(console, 'error');

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          client={chatClient}
          messageComposerContextValue={{ channel }}
          props={{ ...props, ...initialProps }}
        />
      ),
    });

    const composerComposeMock = jest.spyOn(channel.messageComposer, 'compose');
    composerComposeMock.mockRejectedValue(new Error('Error composing message'));

    await waitFor(() => {
      result.current.sendMessage();
    });

    await waitFor(() => {
      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(consoleErrorMock).toHaveBeenCalled();
    });
  });

  it('should get into the catch block if the sendMessage throws an error', async () => {
    const sendMessageMock = jest.fn();
    sendMessageMock.mockRejectedValue(new Error('Error sending message'));

    const initialProps = {
      sendMessage: sendMessageMock,
    };
    const consoleErrorMock = jest.spyOn(console, 'error');

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          client={chatClient}
          messageComposerContextValue={{ channel }}
          props={{ ...props, ...initialProps }}
        />
      ),
    });

    await act(async () => {
      const text = 'Hello there';
      await channel.messageComposer.textComposer.handleChange({
        selection: {
          end: text.length,
          start: text.length,
        },
        text,
      });
    });

    await waitFor(() => {
      result.current.sendMessage();
    });

    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled();
      expect(consoleErrorMock).toHaveBeenCalled();
    });
  });

  it('should not call composer clear if composition has poll id in it', async () => {
    const sendMessageMock = jest.fn();
    const clearSpy = jest.spyOn(channel.messageComposer, 'clear');
    const initialProps = {
      sendMessage: sendMessageMock,
    };
    const { pollComposer } = channel.messageComposer;
    jest.spyOn(chatClient, 'createPoll').mockResolvedValue({ poll: { id: 'test-poll-id' } });

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          client={chatClient}
          messageComposerContextValue={{ channel }}
          props={{ ...props, ...initialProps }}
        />
      ),
    });

    await act(async () => {
      await pollComposer.updateFields({
        id: 'test-poll',
        name: 'Test Poll',
        options: [
          { id: 1, text: '1' },
          { id: 2, text: '2' },
        ],
      });
      await channel.messageComposer.createPoll();
    });

    await waitFor(() => {
      result.current.sendMessage();
    });

    await waitFor(() => {
      expect(clearSpy).not.toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should send message', async () => {
    const sendMessageMock = jest.fn();
    const clearSpy = jest.spyOn(channel.messageComposer, 'clear');
    const initialProps = {
      sendMessage: sendMessageMock,
    };

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          client={chatClient}
          messageComposerContextValue={{ channel }}
          props={{ ...props, ...initialProps }}
        />
      ),
    });

    await act(async () => {
      const text = 'Hello there';
      await channel.messageComposer.textComposer.handleChange({
        selection: {
          end: text.length,
          start: text.length,
        },
        text,
      });
    });

    await waitFor(() => {
      result.current.sendMessage();
    });

    await waitFor(() => {
      expect(clearSpy).toHaveBeenCalled();
      expect(sendMessageMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe("MessageInputContext's editMessage", () => {
  let channel;
  let chatClient;

  beforeAll(async () => {
    const { client, channels } = await initiateClientWithChannels();
    channel = channels[0];
    chatClient = client;
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should clear the edited state when the composition is empty', async () => {
    const editMessageMock = jest.fn();
    const initialProps = {
      editMessage: editMessageMock,
    };

    const clearEditingStateMock = jest.fn();

    jest.spyOn(UseMessageComposerAPIContext, 'useMessageComposerAPIContext').mockReturnValue({
      clearEditingState: clearEditingStateMock,
    } as unknown as MessageComposerAPIContextValue);

    const message = generateMessage({
      attachments: [generateLocalFileUploadAttachmentData()],
      cid: 'messaging:channel-id',
      text: 'test',
    }) as LocalMessage;

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          client={chatClient}
          messageComposerContextValue={{ channel, editing: message }}
          props={{ ...props, ...initialProps }}
        />
      ),
    });

    await waitFor(() => {
      result.current.sendMessage();
    });

    await waitFor(() => {
      expect(clearEditingStateMock).toHaveBeenCalled();
    });
  });
});
