import React from 'react';

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
import { ChannelList } from '../../../ChannelList/ChannelList';
import { Chat } from '../../../Chat/Chat';
import { MessageList } from '../../../MessageList/MessageList';
import { MessageAvatar } from '../MessageAvatar';

afterEach(cleanup);

describe('MessageAvatar', () => {
  it('should render message avatar', async () => {
    const staticUser = generateStaticUser(0);
    const message = generateMessage({
      user: { ...staticUser, image: undefined },
    });
    const { getByTestId, queryAllByTestId, rerender, toJSON } = render(
      <OverlayProvider>
        <ThemeProvider style={defaultTheme}>
          <Chat>
            <ChannelList>
              <Channel>
                <MessageList>
                  <MessageAvatar alignment='right' groupStyles={['bottom']} message={message} />
                </MessageList>
              </Channel>
            </ChannelList>
          </Chat>
        </ThemeProvider>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-avatar')).toBeTruthy();
    });

    rerender(
      <ThemeProvider style={defaultTheme}>
        <MessageList>
          <MessageAvatar alignment='right' groupStyles={[]} message={message} />
        </MessageList>
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
        <MessageList>
          <MessageAvatar
            alignment='left'
            groupStyles={['single']}
            message={staticMessage}
            showAvatar
          />
        </MessageList>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('message-avatar')).toBeTruthy();
      expect(getByTestId('avatar-image')).toBeTruthy();
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
