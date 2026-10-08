import React, { PropsWithChildren } from 'react';
import { Alert } from 'react-native';

import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import { Chat } from '../../../components';
import { getNotificationDisplayMessage } from '../../../components/Notifications/notificationTranslations';
import type { StreamTFunction } from '../../../i18n/types';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../../mock-builders/generator/message';
import { useMessageComposerAPIContext } from '../../messageComposerContext/MessageComposerAPIContext';
import { MessageComposerProvider } from '../../messageComposerContext/MessageComposerContext';
import {
  OwnCapabilitiesContextValue,
  OwnCapabilitiesProvider,
} from '../../ownCapabilitiesContext/OwnCapabilitiesContext';
import { useMessageComposer } from '../hooks/useMessageComposer';
import {
  InputMessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';
import type { InputBoxRef } from '../MessageInputContext';

const t = ((key: string, defaultValue?: string) => defaultValue ?? key) as StreamTFunction;

const useComposerHarness = () => ({
  api: useMessageComposerAPIContext(),
  composer: useMessageComposer(),
  input: useMessageInputContext(),
});

describe("MessageInputContext's sendMessage", () => {
  let channel: Channel;
  let chatClient: StreamChat;

  beforeEach(async () => {
    const { client, channels } = await initiateClientWithChannels();
    channel = channels[0];
    chatClient = client;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
    channel.messageComposer.clear();
  });

  const renderComposer = (capabilities: Partial<OwnCapabilitiesContextValue> = {}) => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <Chat client={chatClient}>
        <OwnCapabilitiesProvider
          value={
            { sendLinks: true, sendMessage: true, ...capabilities } as OwnCapabilitiesContextValue
          }
        >
          <MessageComposerProvider value={{ channel, threadInstance: undefined }}>
            <MessageInputProvider value={{} as InputMessageInputContextValue}>
              {children}
            </MessageInputProvider>
          </MessageComposerProvider>
        </OwnCapabilitiesProvider>
      </Chat>
    );
    const rendered = renderHook(useComposerHarness, { wrapper });
    const inputBox = { clearState: jest.fn(), restoreState: jest.fn() };
    act(() =>
      (rendered.result.current.input.setInputBoxRef as (ref: InputBoxRef | null) => void)(
        inputBox as unknown as InputBoxRef,
      ),
    );
    return { ...rendered, inputBox };
  };

  const typeText = async (text: string, composer = channel.messageComposer) => {
    await act(async () => {
      await composer.textComposer.handleChange({
        selection: { end: text.length, start: text.length },
        text,
      });
    });
  };

  it('sends the composition through the composer and clears the input', async () => {
    const send = jest.spyOn(channel.messageOperations, 'send').mockResolvedValue(undefined);
    const { inputBox, result } = renderComposer();
    await typeText('Hello there');

    await act(() => result.current.input.sendMessage());

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].localMessage.text).toBe('Hello there');
    expect(channel.messageComposer.textComposer.text).toBe('');
    expect(inputBox.clearState).toHaveBeenCalledTimes(1);
    expect(inputBox.restoreState).not.toHaveBeenCalled();
  });

  it('restores the text when there is nothing to send', async () => {
    const send = jest.spyOn(channel.messageOperations, 'send').mockResolvedValue(undefined);
    const { inputBox, result } = renderComposer();
    await typeText('Hello there');
    jest.spyOn(channel.messageComposer, 'compose').mockResolvedValue(undefined);

    await act(() => result.current.input.sendMessage());

    expect(send).not.toHaveBeenCalled();
    expect(inputBox.clearState).toHaveBeenCalledTimes(1);
    expect(inputBox.restoreState).toHaveBeenCalledWith('Hello there');
  });

  it('restores the text when composing throws', async () => {
    const send = jest.spyOn(channel.messageOperations, 'send').mockResolvedValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { inputBox, result } = renderComposer();
    await typeText('Hello there');
    jest
      .spyOn(channel.messageComposer, 'compose')
      .mockRejectedValue(new Error('middleware failed'));

    await act(() => result.current.input.sendMessage());

    expect(send).not.toHaveBeenCalled();
    expect(inputBox.clearState).toHaveBeenCalledTimes(1);
    expect(inputBox.restoreState).toHaveBeenCalledWith('Hello there');
  });

  it('does not send a link where links are not allowed', async () => {
    const send = jest.spyOn(channel.messageOperations, 'send').mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { inputBox, result } = renderComposer({ sendLinks: false });
    await typeText('see https://getstream.io');

    await act(() => result.current.input.sendMessage());

    expect(alert).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(inputBox.clearState).not.toHaveBeenCalled();
    expect(channel.messageComposer.textComposer.text).toBe('see https://getstream.io');
  });

  it('reports a failed send with the send-failure copy', async () => {
    jest.spyOn(channel.messageOperations, 'send').mockRejectedValue(new Error('offline'));
    const { result } = renderComposer();
    await typeText('Hello there');

    await act(() => result.current.input.sendMessage());

    const [notification] = chatClient.notifications.notifications;
    expect(getNotificationDisplayMessage({ notification, t })).toBe('Send message request failed');
  });

  it('saves an edit through the composer, then leaves edit mode', async () => {
    const update = jest.spyOn(channel.messageOperations, 'update').mockResolvedValue(undefined);
    const message = generateMessage({ cid: channel.cid, text: 'before' }) as LocalMessage;
    const { result } = renderComposer();

    act(() => result.current.api.setEditingState(message));
    const editComposer = result.current.composer;
    expect(editComposer).not.toBe(channel.messageComposer);
    await typeText('after', editComposer);

    await act(() => result.current.input.sendMessage());

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].localMessage.text).toBe('after');
    await waitFor(() => expect(result.current.composer).toBe(channel.messageComposer));
  });

  it('sends a bounced message again as a new message, then leaves edit mode', async () => {
    const send = jest.spyOn(channel.messageOperations, 'send').mockResolvedValue(undefined);
    const update = jest.spyOn(channel.messageOperations, 'update').mockResolvedValue(undefined);
    const message = generateMessage({
      cid: channel.cid,
      text: 'bounced',
      type: 'error',
    }) as LocalMessage;
    const { result } = renderComposer();

    act(() => result.current.api.setEditingState(message));
    await act(() => result.current.input.sendMessage());

    expect(send).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.composer).toBe(channel.messageComposer));
  });
});
