import React from 'react';

import { cleanup, render, screen, waitFor } from '@testing-library/react-native';
import type { LocalMessage, StreamChat } from 'stream-chat';

import type { DeepPartial } from '../../../../contexts/themeContext/ThemeContext';
import type { Theme } from '../../../../contexts/themeContext/utils/theme';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import {
  generateMessage,
  generateStaticMessage,
} from '../../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Chat } from '../../../Chat/Chat';
import { MessageAuthor } from '../MessageAuthor';

afterEach(cleanup);

describe('MessageAuthor', () => {
  let chatClient: StreamChat;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'me' });
  });

  it('should render message author', async () => {
    const staticUser = generateStaticUser(0);
    const message = generateMessage({
      user: { ...staticUser, image: undefined },
    });
    render(
      <Chat client={chatClient} style={defaultTheme as DeepPartial<Theme>}>
        <MessageAuthor
          {...({
            alignment: 'right',
            groupStyles: ['bottom'],
          } as unknown as React.ComponentProps<typeof MessageAuthor>)}
          message={message as unknown as LocalMessage}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-author')).toBeTruthy();
    });

    screen.rerender(
      <Chat client={chatClient} style={defaultTheme as DeepPartial<Theme>}>
        <MessageAuthor
          {...({
            alignment: 'right',
            groupStyles: [],
          } as unknown as React.ComponentProps<typeof MessageAuthor>)}
          message={message as unknown as LocalMessage}
        />
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
      <Chat client={chatClient} style={defaultTheme as DeepPartial<Theme>}>
        <MessageAuthor
          {...({
            alignment: 'left',
            groupStyles: ['single'],
          } as unknown as React.ComponentProps<typeof MessageAuthor>)}
          message={staticMessage as unknown as LocalMessage}
          showAvatar
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-author')).toBeTruthy();
      expect(screen.getByTestId('user-avatar')).toBeTruthy();
      expect(screen.toJSON()).toMatchSnapshot();
    });
  });
});
