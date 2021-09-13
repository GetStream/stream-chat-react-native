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

  it('should render an avatar with a random image and no size', async () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <Avatar name='Test User' />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image').props.source).toMatchObject({
        uri: 'https://getstream.io/random_png/?name=T U&size=undefined',
      });
    });
  });

  it('should render an avatar with a random image and custom size', async () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <Avatar name='Test User' size={20} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image').props.source).toMatchObject({
        uri: 'https://getstream.io/random_png/?name=T U&size=20',
      });
    });
  });
});
