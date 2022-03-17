import React from 'react';
import type Animated from 'react-native-reanimated';
import { useSharedValue } from 'react-native-reanimated';

import { renderHook } from '@testing-library/react-hooks';

import { render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';

import { ImageGalleryHeader } from '../ImageGalleryHeader';

it('doesnt fail if fromNow is not available on first render', () => {
  try {
    let sharedValueOpacity: Animated.SharedValue<number>;
    let sharedValueVisible: Animated.SharedValue<number>;
    renderHook(() => {
      sharedValueOpacity = useSharedValue(1);
      sharedValueVisible = useSharedValue(1);
    });
    const { getAllByText } = render(
      <ThemeProvider>
        <ImageGalleryHeader
          // @ts-ignore
          opacity={sharedValueOpacity}
          photo={{
            id: 'id',
            uri: 'file:///bogus/uri/to/photo.jpg',
          }}
          // @ts-ignore
          visible={sharedValueVisible}
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
