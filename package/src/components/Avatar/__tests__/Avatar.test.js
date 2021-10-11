import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { Avatar } from '../Avatar';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';

describe('Avatar', () => {
  it('should render an image with no name and default size', async () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <Avatar image='https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg' />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeTruthy();
    });
  });

  it('should render an image with name and default size', async () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <Avatar
          image='https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg'
          name='Test User'
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeTruthy();
    });
  });

  it('should render an image with custom size', async () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <Avatar
          image='https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg'
          size={20}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeTruthy();
    });
  });

  it('should render an avatar with a random image and default size', async () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <Avatar name='Test User' />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-placeholder').props.style[0]).toMatchObject({
        borderRadius: 16,
        height: 32,
        width: 32,
      });
    });
  });

  it('should render an avatar with placeholder and custom size', async () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <Avatar name='Test User' size={20} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-placeholder').props.style[0]).toMatchObject({
        borderRadius: 16,
        height: 32,
        width: 32,
      });
    });
  });
});
