import React from 'react';
import { Text } from 'react-native';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../../mock-builders/generator/user';
import { MessageTextContainer } from '../MessageTextContainer';
import type { MessageType } from '../../../MessageList/hooks/useMessageList';

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
});
