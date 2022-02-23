import React from 'react';

import type Animated from 'react-native-reanimated';

import { render } from '@testing-library/react-native';

import { OverlayProvider } from '../../../../contexts/overlayContext/OverlayProvider';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { ImageGalleryHeader } from '../ImageGalleryHeader';

it('doesnt fail if fromNow is not available on first render', () => {
  try {
    const { getAllByText } = render(
      <OverlayProvider
        overlayOpacity={{
          value: 1,
        }}
      >
        <ThemeProvider>
          <ImageGalleryHeader
            opacity={1 as unknown as Animated.SharedValue<number>}
            photo={{
              id: 'id',
              uri: 'file:///bogus/uri/to/photo.jpg',
            }}
            visible={1 as unknown as Animated.SharedValue<number>}
          />
        </ThemeProvider>
      </OverlayProvider>,
    );

    expect(getAllByText('Unknown User')).toBeTruthy();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Error encountered on first render of ImageGalleryHeader: ${error.message}`);
    }
  }
});
