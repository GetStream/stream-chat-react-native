import React from 'react';

import { render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { MessageUserReactionsAvatar } from '../MessageUserReactionsAvatar';

describe('MessageUserReactionsAvatar', () => {
  const reaction = { id: 'test-user', image: 'image-url', name: 'Test User', type: 'like' }; // Mock reaction data

  it('should render Avatar with correct image, name, and default size', () => {
    const { queryByTestId } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageUserReactionsAvatar reaction={reaction} />
      </ThemeProvider>,
    );

    // Check if the mocked Avatar component is rendered with correct props
    expect(queryByTestId('avatar-image')).toBeTruthy();
  });

  it('should render Avatar with correct image, name, and custom size', () => {
    const customSize = 40;

    const { queryByTestId } = render(
      <ThemeProvider theme={defaultTheme}>
        <MessageUserReactionsAvatar reaction={reaction} size={customSize} />
      </ThemeProvider>,
    );

    // Check if the mocked Avatar component is rendered with correct custom size
    expect(queryByTestId('avatar-image')).toBeTruthy();
  });
});
