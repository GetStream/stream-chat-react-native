import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { MessagePinned } from '../MessagePinned';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../../mock-builders/generator/user';

afterEach(cleanup);

describe('MessagePinned', () => {
  it('should render message pinned', async () => {
    const staticUser = generateStaticUser(0);
    const message = generateMessage({
      user: { ...staticUser, image: undefined },
    });
    const { getByTestId, rerender, toJSON } = render(
      <ThemeProvider style={defaultTheme}>
        <MessagePinned alignment='right' message={message} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-pinned')).toBeTruthy();
    });

    rerender(
      <ThemeProvider style={defaultTheme}>
        <MessagePinned alignment='right' message={message} />
      </ThemeProvider>,
    );

    const staticMessage = generateStaticMessage('hi', {
      user: staticUser,
    });

    rerender(
      <ThemeProvider style={defaultTheme}>
        <MessagePinned alignment='left' message={staticMessage} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-pinned')).toBeTruthy();
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
