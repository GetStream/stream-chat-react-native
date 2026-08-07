import React from 'react';
import { StyleSheet } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { render, screen, waitFor } from '@testing-library/react-native';

import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import { MessageProvider } from '../../../contexts/messageContext/MessageContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { mergeThemes } from '../../../contexts/themeContext/ThemeContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { Reply } from '../Reply';

describe('<Reply/>', () => {
  it('can be rendered outside of a MessageInputProvider', async () => {
    const oldEnvironment = process.env;
    process.env.NODE_ENV = 'not_test';

    const chatClient = await getTestClientWithUser({ id: 'neil' });

    const mockedChannel = generateChannelResponse();
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', 'some-chat');
    await channel.watch();

    const TestComponent = () => (
      <GestureHandlerRootView>
        <OverlayProvider>
          <Chat client={chatClient}>
            <Channel channel={channel} client={chatClient}>
              <Reply mode='reply' />
            </Channel>
          </Chat>
        </OverlayProvider>
      </GestureHandlerRootView>
    );

    try {
      const { toJSON } = render(<TestComponent />);

      await waitFor(() => {
        expect(toJSON()).not.toBeNull();
      });
    } catch (error: unknown) {
      throw new Error(`Error thrown while rendering Reply: ${error}`);
    }

    process.env = oldEnvironment;
  });

  describe('chat text side', () => {
    const lightTheme = mergeThemes({ scheme: 'light' });

    const setup = async () => {
      const chatClient = await getTestClientWithUser({ id: 'neil' });
      const mockedChannel = generateChannelResponse();
      useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
      const channel = chatClient.channel('messaging', 'some-chat');
      await channel.watch();
      return { chatClient, channel };
    };

    const titleColor = (title: string) =>
      StyleSheet.flatten(screen.getByText(title).props.style)?.color;

    // An in-message quoted reply is painted inside the parent bubble, whose
    // background `MessageContent` resolves from the parent message. The colours
    // must follow that surface; only the title *copy* describes the quoted author.
    // The composer holds no quoted message in either case, so these also pin that
    // the block never styles itself from composer state.
    const renderInMessageQuotedReply = (
      { chatClient, channel }: Awaited<ReturnType<typeof setup>>,
      {
        isMyMessage,
        quotedMessageUser,
      }: { isMyMessage: boolean; quotedMessageUser: { id: string; name?: string } },
    ) => {
      const quotedMessage = generateMessage({ user: quotedMessageUser });
      const message = generateMessage({
        quoted_message: quotedMessage,
        quoted_message_id: quotedMessage.id,
        user: isMyMessage ? { id: 'neil' } : generateUser(),
      });

      render(
        <GestureHandlerRootView>
          <OverlayProvider>
            <Chat client={chatClient}>
              <Channel channel={channel} client={chatClient}>
                <MessageProvider value={{ isMyMessage, message } as unknown as MessageContextValue}>
                  <Reply mode='reply' />
                </MessageProvider>
              </Channel>
            </Chat>
          </OverlayProvider>
        </GestureHandlerRootView>,
      );
    };

    it('styles an in-message quoted reply from the parent message, not the quoted author', async () => {
      const setupResult = await setup();

      // Our own message quoting somebody else: outgoing surface, so outgoing text
      // even though the quoted author is not us.
      renderInMessageQuotedReply(setupResult, {
        isMyMessage: true,
        quotedMessageUser: { id: 'other-user', name: 'Other User' },
      });

      await waitFor(() => {
        expect(titleColor('Reply to Other User')).toBe(lightTheme.semantics.chatTextOutgoing);
      });
    });

    it('keeps the title copy on the quoted author while the colours follow the parent', async () => {
      const setupResult = await setup();

      // Somebody else's message quoting us: incoming surface, so incoming text -
      // but the title still reads "You", because that describes the quoted author.
      renderInMessageQuotedReply(setupResult, {
        isMyMessage: false,
        quotedMessageUser: { id: 'neil' },
      });

      await waitFor(() => {
        expect(titleColor('You')).toBe(lightTheme.semantics.chatTextIncoming);
      });
    });

    it('uses outgoing colors for the edit-mode composer header', async () => {
      const { chatClient, channel } = await setup();

      // `mode='edit'` supplies the message through props and leaves the
      // composer's quoted message empty - you can only ever edit your own message.
      const editedMessage = generateMessage({ user: { id: 'neil' } });

      render(
        <GestureHandlerRootView>
          <OverlayProvider>
            <Chat client={chatClient}>
              <Channel channel={channel} client={chatClient}>
                <Reply mode='edit' quotedMessage={editedMessage} />
              </Channel>
            </Chat>
          </OverlayProvider>
        </GestureHandlerRootView>,
      );

      await waitFor(() => {
        expect(titleColor('Edit Message')).toBe(lightTheme.semantics.chatTextOutgoing);
      });
    });
  });
});
