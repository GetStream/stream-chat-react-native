import React, { PropsWithChildren } from 'react';

import { act, cleanup, render, renderHook } from '@testing-library/react-native';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import { Chat } from '../../../components';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../../mock-builders/generator/message';
import { useMessageComposer } from '../../messageInputContext/hooks/useMessageComposer';
import { useMessageComposerAPIContext } from '../MessageComposerAPIContext';
import { MessageComposerProvider } from '../MessageComposerContext';

describe('MessageComposerProvider', () => {
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
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <Chat client={chatClient}>
      <MessageComposerProvider value={{ channel, threadInstance: undefined }}>
        {children}
      </MessageComposerProvider>
    </Chat>
  );

  it('starts a repeated edit from the message, not from where an abandoned edit left off', async () => {
    const message = generateMessage({ cid: channel.cid, text: 'original' }) as LocalMessage;
    const { result } = renderHook(
      () => ({ api: useMessageComposerAPIContext(), composer: useMessageComposer() }),
      { wrapper },
    );

    act(() => result.current.api.setEditingState(message));
    await act(async () => {
      await result.current.composer.textComposer.handleChange({
        selection: { end: 14, start: 14 },
        text: 'abandoned edit',
      });
    });
    act(() => result.current.api.clearEditingState());
    expect(result.current.composer).toBe(channel.messageComposer);

    act(() => result.current.api.setEditingState(message));

    expect(result.current.composer.textComposer.text).toBe('original');
  });

  it('subscribes the composer once, however many components read it', () => {
    const registerSubscriptions = jest.spyOn(channel.messageComposer, 'registerSubscriptions');
    const Reader = () => {
      useMessageComposer();
      return null;
    };

    render(
      <Chat client={chatClient}>
        <MessageComposerProvider value={{ channel, threadInstance: undefined }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Reader key={i} />
          ))}
        </MessageComposerProvider>
      </Chat>,
    );

    expect(registerSubscriptions).toHaveBeenCalledTimes(1);
  });
});
