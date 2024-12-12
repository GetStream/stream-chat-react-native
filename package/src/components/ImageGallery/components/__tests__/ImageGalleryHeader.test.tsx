import React from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

import { render, renderHook, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';

import { ImageGalleryHeader } from '../ImageGalleryHeader';

it('doesnt fail if fromNow is not available on first render', async () => {
  try {
    let sharedValueOpacity: SharedValue<number>;
    let sharedValueVisible: SharedValue<number>;
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
    await waitFor(() => {
      expect(getAllByText('Unknown User')).toBeTruthy();
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Error encountered on first render of ImageGalleryHeader: ${error.message}`);
    }
  }
});
