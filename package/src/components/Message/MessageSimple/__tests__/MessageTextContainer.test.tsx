import React from 'react';
import { Text } from 'react-native';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../../contexts/overlayContext/OverlayProvider';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import type { MessageType } from '../../../MessageList/hooks/useMessageList';
import { MessageList } from '../../../MessageList/MessageList';
import { MessageTextContainer } from '../MessageTextContainer';

afterEach(cleanup);

describe('MessageTextContainer', () => {
  it('should render message text container', async () => {
    const staticUser = generateStaticUser(1);
    const message = generateMessage({
      user: { ...staticUser, image: undefined },
    });
    const { getByTestId, getByText, rerender, toJSON } = render(
      <ThemeProvider style={defaultTheme}>
        <MessageTextContainer message={message as unknown as MessageType} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-text-container')).toBeTruthy();
      expect(getByText(message.text)).toBeTruthy();
    });

    rerender(
      <ThemeProvider style={defaultTheme}>
        <MessageTextContainer
          message={message as unknown as MessageType}
          MessageText={({ message }) => <Text testID='message-text'>{message?.text}</Text>}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-text-container')).toBeTruthy();
      expect(getByTestId('message-text')).toBeTruthy();
      expect(getByText(message.text)).toBeTruthy();
    });

    const staticMessage = generateStaticMessage('Hello World', {
      user: staticUser,
    });

    rerender(
      <ThemeProvider style={defaultTheme}>
        <MessageTextContainer message={staticMessage as unknown as MessageType} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });

  it('should display a translated message if applicable', async () => {
    const chatClient = await getTestClientWithUser({ id: 'mads', language: 'no' });

    const message = {
      i18n: {
        no_text: 'Hallo verden!',
      },
      text: 'Hello world!',
    };

    const mockedChannel = generateChannelResponse({
      id: 'chans',
      messages: [message],
    });

    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', 'chans');
    await channel.watch();

    const TestComponent = () => (
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>
    );

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByText(message.i18n.no_text)).toBeTruthy();
    });
  });
});
