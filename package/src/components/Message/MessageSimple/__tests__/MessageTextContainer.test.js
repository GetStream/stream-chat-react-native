import React from 'react';
import { Text } from 'react-native';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../../contexts/overlayContext/OverlayProvider';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../../mock-builders/generator/user';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
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
      <OverlayProvider>
        <Chat>
          <Channel>
            <ThemeProvider style={defaultTheme}>
              <MessageList>
                <MessageTextContainer alignment='right' groupStyles={['top']} message={message} />
              </MessageList>
            </ThemeProvider>
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-text-container')).toBeTruthy();
      expect(getByText(message.text)).toBeTruthy();
    });

    rerender(
      <ThemeProvider style={defaultTheme}>
        <MessageList>
          <MessageTextContainer
            alignment='right'
            groupStyles={['top']}
            message={message}
            MessageText={({ message }) => <Text testID='message-text'>{message.text}</Text>}
          />
        </MessageList>
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
        <MessageList>
          <MessageTextContainer message={staticMessage} />
        </MessageList>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
