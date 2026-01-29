import React from 'react';

import { cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Chat } from '../../../Chat/Chat';
import { MessageAvatar } from '../MessageAvatar';

afterEach(cleanup);

describe('MessageAvatar', () => {
  let chatClient;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'me' });
  });

  it('should render message avatar', async () => {
    const staticUser = generateStaticUser(0);
    const message = generateMessage({
      user: { ...staticUser, image: undefined },
    });
    render(
      <Chat client={chatClient} style={defaultTheme}>
        <MessageAvatar alignment='right' groupStyles={['bottom']} message={message} />
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-avatar')).toBeTruthy();
    });

    screen.rerender(
      <Chat client={chatClient} style={defaultTheme}>
        <MessageAvatar alignment='right' groupStyles={[]} message={message} />
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('spacer')).toBeTruthy();
      expect(screen.queryAllByTestId('user-avatar')).toHaveLength(0);
    });

    const staticMessage = generateStaticMessage('hi', {
      user: staticUser,
    });

    screen.rerender(
      <Chat client={chatClient} style={defaultTheme}>
        <MessageAvatar
          alignment='left'
          groupStyles={['single']}
          message={staticMessage}
          showAvatar
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-avatar')).toBeTruthy();
      expect(screen.getByTestId('user-avatar')).toBeTruthy();
      expect(screen.toJSON()).toMatchSnapshot();
    });
  });
});
