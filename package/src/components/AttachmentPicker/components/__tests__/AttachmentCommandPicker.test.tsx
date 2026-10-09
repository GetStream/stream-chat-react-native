import React from 'react';

import { act, cleanup, render, screen } from '@testing-library/react-native';
import type { Channel, Command, StreamChat } from 'stream-chat';

import { MessageComposerProvider } from '../../../../contexts/messageComposerContext/MessageComposerContext';
import { initiateClientWithChannels } from '../../../../mock-builders/api/initiateClientWithChannels';
import { Chat } from '../../../Chat/Chat';
import { AttachmentCommandPicker } from '../AttachmentPickerContent';

describe('AttachmentCommandPicker', () => {
  let channel: Channel;
  let chatClient: StreamChat;

  beforeEach(async () => {
    const { client, channels } = await initiateClientWithChannels();
    channel = channels[0];
    chatClient = client;
  });

  afterEach(cleanup);

  it('lists commands that arrive after it mounted', () => {
    const setCommands = (commands: Command[]) =>
      chatClient.channelServerConfigsStore.partialNext({
        configs: { ...chatClient.channelServerConfigs, [channel.cid]: { commands } as never },
      });
    act(() => setCommands([]));

    render(
      <Chat client={chatClient}>
        <MessageComposerProvider value={{ channel, threadInstance: undefined }}>
          <AttachmentCommandPicker />
        </MessageComposerProvider>
      </Chat>,
    );
    expect(screen.queryByText('Giphy')).toBeNull();

    act(() =>
      setCommands([
        { args: '[text]', description: 'Post a random gif', name: 'giphy', set: 'fun_set' },
      ]),
    );

    expect(screen.getByText('Giphy')).toBeTruthy();
  });
});
