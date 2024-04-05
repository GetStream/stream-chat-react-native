import React from 'react';

import { cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../../mock-builders/generator/user';
import { MessageAvatar } from '../MessageAvatar';

afterEach(cleanup);

describe('MessageAvatar', () => {
  it('should render message avatar', async () => {
    const staticUser = generateStaticUser(0);
    const message = generateMessage({
      user: { ...staticUser, image: undefined },
    });
    render(
      <ThemeProvider style={defaultTheme}>
        <MessageAvatar alignment='right' groupStyles={['bottom']} message={message} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-avatar')).toBeTruthy();
    });

    screen.rerender(
      <ThemeProvider style={defaultTheme}>
        <MessageAvatar alignment='right' groupStyles={[]} message={message} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('spacer')).toBeTruthy();
      expect(screen.queryAllByTestId('avatar-image')).toHaveLength(0);
    });

    const staticMessage = generateStaticMessage('hi', {
      user: staticUser,
    });

    screen.rerender(
      <ThemeProvider style={defaultTheme}>
        <MessageAvatar
          alignment='left'
          groupStyles={['single']}
          message={staticMessage}
          showAvatar
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-avatar')).toBeTruthy();
      expect(screen.getByTestId('avatar-image')).toBeTruthy();
      expect(screen.toJSON()).toMatchSnapshot();
    });
  });
});
