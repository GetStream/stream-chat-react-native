import React from 'react';

import type Animated from 'react-native-reanimated';

import { render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { ImageGalleryHeader } from '../ImageGalleryHeader';

it('doesnt fail if fromNow is not available on first render', () => {
  try {
    const { getAllByText } = render(
      <ThemeProvider>
        <ImageGalleryHeader
          opacity={1 as unknown as Animated.SharedValue<number>}
          photo={{
            id: 'id',
            uri: 'file:///bogus/uri/to/photo.jpg',
          }}
          visible={1 as unknown as Animated.SharedValue<number>}
        />
      </ThemeProvider>,
    );

    expect(getAllByText('Unknown User')).toBeTruthy();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Error encountered on first render of ImageGalleryHeader: ${error.message}`);
    }
  }
});
