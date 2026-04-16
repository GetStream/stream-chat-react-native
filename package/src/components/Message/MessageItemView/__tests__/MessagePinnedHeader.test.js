import React from 'react';

import { cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../../mock-builders/generator/user';
import { MessagePinnedHeader } from '../Headers/MessagePinnedHeader';

afterEach(cleanup);

describe('MessagePinnedHeader', () => {
  it('should render message pinned', async () => {
    const staticUser = generateStaticUser(0);
    const message = generateMessage({
      user: { ...staticUser, image: undefined },
      pinned: true,
    });
    render(
      <ThemeProvider style={defaultTheme}>
        <MessagePinnedHeader message={message} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Message Pinned Header')).toBeTruthy();
    });

    screen.rerender(
      <ThemeProvider style={defaultTheme}>
        <MessagePinnedHeader message={message} />
      </ThemeProvider>,
    );

    const staticMessage = generateStaticMessage('hi', {
      user: staticUser,
      pinned: false,
    });

    screen.rerender(
      <ThemeProvider style={defaultTheme}>
        <MessagePinnedHeader message={staticMessage} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Message Pinned Header')).toBeNull();
      expect(screen.toJSON()).toMatchSnapshot();
    });
  });
});
