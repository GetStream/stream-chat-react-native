import React, { useEffect, useState } from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import { ImageGalleryHeader as ImageGalleryHeaderDefault } from '../../../components/ImageGallery/components/ImageGalleryHeader';
import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import * as overlayContext from '../../../contexts/overlayContext/OverlayContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { generateImageAttachment } from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';

import { ImageGalleryStateStore } from '../../../state-store/image-gallery-state-store';
import { ImageGallery, ImageGalleryProps } from '../ImageGallery';

jest.mock('../../../native.ts', () => {
  const { View } = require('react-native');
  return {
    isFileSystemAvailable: jest.fn(() => true),
    isImageMediaLibraryAvailable: jest.fn(() => true),
    isShareImageAvailable: jest.fn(() => true),
    isVideoPlayerAvailable: jest.fn(() => true),
    NativeHandlers: {
      Video: View,
    },
  };
});

const ImageGalleryComponent = (props: ImageGalleryProps) => {
  const [imageGalleryStateStore] = useState(() => new ImageGalleryStateStore());
  const attachment = generateImageAttachment();
  imageGalleryStateStore.openImageGallery({
    messages: [generateMessage({ attachments: [attachment] }) as unknown as LocalMessage],
    selectedAttachmentUrl: attachment.image_url,
  });

  useEffect(() => {
    const unsubscribe = imageGalleryStateStore.registerSubscriptions();

    return () => {
      unsubscribe();
    };
  }, [imageGalleryStateStore]);

  return (
    <OverlayProvider value={{ overlayOpacity: { value: 1 } as SharedValue<number> }}>
      <ImageGalleryContext.Provider
        value={
          {
            imageGalleryStateStore,
            ImageGalleryHeader: ImageGalleryHeaderDefault,
          } as unknown as ImageGalleryContextValue
        }
      >
        <ImageGallery {...props} />
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

describe('ImageGalleryHeader', () => {
  it('render image gallery header component with default header elements', async () => {
    render(<ImageGalleryComponent />);

    await waitFor(() => {
      expect(screen.getByLabelText('Hide Overlay')).toBeTruthy();
    });
  });

  it('should trigger the hideOverlay function on button onPress', async () => {
    const setOverlayMock = jest.fn();
    const user = userEvent.setup();

    jest.spyOn(overlayContext, 'useOverlayContext').mockImplementation(() => ({
      setOverlay: setOverlayMock,
    }));

    render(<ImageGalleryComponent />);

    await waitFor(() => {
      expect(screen.getByLabelText('Hide Overlay')).toBeTruthy();
    });

    await user.press(screen.getByLabelText('Hide Overlay'));

    await waitFor(() => {
      expect(setOverlayMock).toHaveBeenCalledWith('none');
    });
  });
});
