import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { MentionsItem } from '../MentionsItem';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';

describe('MentionsItem', () => {
  it('should render MentionsItem with an avatar image with no name and no mention name', async () => {
    const { queryByTestId } = render(
      <ThemeProvider>
        <MentionsItem
          item={{
            image: 'https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg',
          }}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeTruthy();
      expect(queryByTestId('avatar-text')).toBeFalsy();
      expect(queryByTestId('mentions-item-name')).toBeTruthy();
    });
  });

  it('should render MentionsItem with no avatar image but a name', async () => {
    const { getByTestId, queryByTestId } = render(
      <ThemeProvider>
        <MentionsItem item={{ name: 'Test User' }} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image').props.source).toMatchObject({
        uri: 'https://getstream.io/random_png/?name=T U&size=40',
      });
      expect(queryByTestId('mentions-item-name')).toBeTruthy();
      expect(getByTestId('mentions-item-name')).toHaveTextContent('Test User');
    });
  });

  it('should render MentionsItem with avatar image and name as id', async () => {
    const { getByTestId, queryByTestId } = render(
      <ThemeProvider>
        <MentionsItem
          item={{
            id: 'Test User',
            image: 'https://pbs.twimg.com/profile_images/897621870069112832/dFGq6aiE_400x400.jpg',
          }}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryByTestId('avatar-image')).toBeTruthy();
      expect(queryByTestId('avatar-text')).toBeFalsy();
      expect(queryByTestId('mentions-item-name')).toBeTruthy();
      expect(getByTestId('mentions-item-name')).toHaveTextContent('Test User');
    });
  });
});
