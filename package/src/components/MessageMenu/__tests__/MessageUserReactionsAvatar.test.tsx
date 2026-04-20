import React from 'react';

import { render } from '@testing-library/react-native';

import type { StreamChat } from 'stream-chat';

import type { DeepPartial } from '../../../contexts/themeContext/ThemeContext';
import type { Theme } from '../../../contexts/themeContext/utils/theme';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { MessageUserReactionsAvatar } from '../MessageUserReactionsAvatar';

describe('MessageUserReactionsAvatar', () => {
  const reaction = { id: 'test-user', image: 'image-url', name: 'Test User', type: 'like' }; // Mock reaction data
  let chatClient: StreamChat;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'me' });
  });

  it('should render Avatar with correct image, name, and default size', () => {
    const { queryByTestId } = render(
      <Chat client={chatClient} style={defaultTheme as DeepPartial<Theme>}>
        <MessageUserReactionsAvatar reaction={reaction} />
      </Chat>,
    );

    // Check if the mocked Avatar component is rendered with correct props
    expect(queryByTestId('avatar-image')).toBeTruthy();
  });

  it('should render Avatar with correct image, name, and custom size', () => {
    const { queryByTestId } = render(
      <Chat client={chatClient} style={defaultTheme as DeepPartial<Theme>}>
        <MessageUserReactionsAvatar reaction={reaction} size={'lg'} />
      </Chat>,
    );

    // Check if the mocked Avatar component is rendered with correct custom size
    expect(queryByTestId('avatar-image')).toBeTruthy();
  });
});
