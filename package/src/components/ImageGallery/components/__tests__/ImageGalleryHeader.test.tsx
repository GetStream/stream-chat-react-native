import React, { PropsWithChildren, useState } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

import { render, renderHook, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../../contexts/overlayContext/OverlayProvider';
import { generateImageAttachment } from '../../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { ImageGalleryStateStore } from '../../../../state-store/image-gallery-state-store';
import { ImageGalleryHeader } from '../ImageGalleryHeader';

const ImageGalleryComponentWrapper = ({ children }: PropsWithChildren) => {
  const initialImageGalleryStateStore = new ImageGalleryStateStore();
  const attachment = generateImageAttachment();
  initialImageGalleryStateStore.openImageGallery({
    message: generateMessage({
      attachments: [attachment],
      user: {},
    }) as unknown as LocalMessage,
    selectedAttachmentUrl: attachment.url,
  });

  const [imageGalleryStateStore] = useState(initialImageGalleryStateStore);

  return (
    <OverlayProvider value={{ overlayOpacity: { value: 1 } as SharedValue<number> }}>
      <ImageGalleryContext.Provider
        value={{ imageGalleryStateStore } as unknown as ImageGalleryContextValue}
      >
        {children}
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

it('doesnt fail if fromNow is not available on first render', async () => {
  try {
    let sharedValueOpacity: SharedValue<number>;
    let sharedValueVisible: SharedValue<number>;
    renderHook(() => {
      sharedValueOpacity = useSharedValue(1);
      sharedValueVisible = useSharedValue(1);
    });
    const { getAllByText } = render(
      <ImageGalleryComponentWrapper>
        <ImageGalleryHeader
          // @ts-ignore
          opacity={sharedValueOpacity}
          // @ts-ignore
          visible={sharedValueVisible}
        />
      </ImageGalleryComponentWrapper>,
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
