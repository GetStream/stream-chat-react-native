import React from 'react';
import { Text } from 'react-native';
import { ThemeProvider } from '@stream-io/styled-components';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import {
  generateMessage,
  generateStaticMessage,
} from 'mock-builders/generator/message';
import { generateStaticUser } from 'mock-builders/generator/user';

import MessageTextContainer from '../MessageTextContainer';

import { defaultTheme } from '../../../../styles/theme';

afterEach(cleanup);

describe('MessageTextContainer', () => {
  it('should render message text container', async () => {
    const staticUser = generateStaticUser(1);
    const message = generateMessage({
      user: { ...staticUser, image: undefined },
    });
    const { getByTestId, getByText, rerender, toJSON } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageTextContainer
          alignment='right'
          groupStyles={['top']}
          message={message}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-text-container')).toBeTruthy();
      expect(getByText(message.text)).toBeTruthy();
    });

    rerender(
      <ThemeProvider theme={defaultTheme}>
        <MessageTextContainer
          alignment='right'
          groupStyles={['top']}
          message={message}
          MessageText={({ message }) => (
            <Text testID='message-text'>{message.text}</Text>
          )}
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
      <ThemeProvider theme={defaultTheme}>
        <MessageTextContainer message={staticMessage} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
