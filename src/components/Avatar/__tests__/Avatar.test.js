import React from 'react';
import { getNodeText, render, waitFor } from '@testing-library/react-native';

import Avatar from '../Avatar';

describe('Avatar', () => {
  it('should render an image with no name and default size', async () => {
    const { queryByTestId } = render(
      <Avatar image='https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg' />,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeTruthy();
      expect(queryByTestId('avatar-text')).toBeFalsy();
    });
  });

  it('should render an image with name and default size', async () => {
    const { queryByTestId } = render(
      <Avatar
        image='https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg'
        name='Test User'
      />,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeTruthy();
      expect(queryByTestId('avatar-text')).toBeFalsy();
    });
  });

  it('should render an image with custom size', async () => {
    const { queryByTestId } = render(
      <Avatar
        image='https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg'
        size={20}
      />,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeTruthy();
      expect(queryByTestId('avatar-text')).toBeFalsy();
    });
  });

  it('should render an avatar with no image but a name and default size', async () => {
    const { getByTestId, queryByTestId } = render(<Avatar name='Test User' />);

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeFalsy();
      expect(queryByTestId('avatar-text')).toBeTruthy();
      expect(getNodeText(getByTestId('avatar-text'))).toBe('TU');
    });
  });

  it('should render an avatar with no image but a name and custom size', async () => {
    const { getByTestId, queryByTestId } = render(
      <Avatar name='Test User' size={20} />,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeFalsy();
      expect(queryByTestId('avatar-text')).toBeTruthy();
      expect(getNodeText(getByTestId('avatar-text'))).toBe('TU');
    });
  });
});
