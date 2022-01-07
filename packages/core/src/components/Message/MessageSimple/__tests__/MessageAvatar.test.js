import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

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
    const { getByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider style={defaultTheme}>
        <MessageAvatar alignment='right' groupStyles={['bottom']} message={message} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-avatar')).toBeTruthy();
    });

    rerender(
      <ThemeProvider style={defaultTheme}>
        <MessageAvatar alignment='right' groupStyles={[]} message={message} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('spacer')).toBeTruthy();
      expect(queryAllByTestId('avatar-image')).toHaveLength(0);
    });

    const staticMessage = generateStaticMessage('hi', {
      user: staticUser,
    });

    rerender(
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
      expect(getByTestId('message-avatar')).toBeTruthy();
      expect(getByTestId('avatar-image')).toBeTruthy();
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
