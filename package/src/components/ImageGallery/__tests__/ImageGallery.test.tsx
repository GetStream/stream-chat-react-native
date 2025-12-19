import React, { useEffect, useState } from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { render, screen, waitFor } from '@testing-library/react-native';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { LocalMessage } from 'stream-chat';

import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import {
  generateGiphyAttachment,
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';

import { ImageGalleryStateStore } from '../../../state-store/image-gallery-state-store';
import { ImageGallery, ImageGalleryProps } from '../ImageGallery';

dayjs.extend(duration);

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

const ImageGalleryComponent = (props: ImageGalleryProps & { message: LocalMessage }) => {
  const [imageGalleryStateStore] = useState(() => new ImageGalleryStateStore());

  useEffect(() => {
    const unsubscribe = imageGalleryStateStore.registerSubscriptions();

    return () => {
      unsubscribe();
    };
  }, [imageGalleryStateStore]);

  const { attachments } = props.message;
  imageGalleryStateStore.openImageGallery({
    messages: [props.message],
    selectedAttachmentUrl: attachments?.[0]?.asset_url || attachments?.[0]?.image_url || '',
  });

  return (
    <OverlayProvider value={{ overlayOpacity: { value: 1 } as SharedValue<number> }}>
      <ImageGalleryContext.Provider
        value={{ imageGalleryStateStore } as unknown as ImageGalleryContextValue}
      >
        <ImageGallery {...props} />
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

describe('ImageGallery', () => {
  it('render image gallery component', async () => {
    render(
      <ImageGalleryComponent
        message={
          generateMessage({
            attachments: [
              generateImageAttachment(),
              generateGiphyAttachment(),
              generateVideoAttachment({ type: 'video' }),
            ],
          }) as unknown as LocalMessage
        }
      />,
    );

    await waitFor(() => {
      expect(screen.queryAllByLabelText('Image Item')).toHaveLength(2);
      expect(screen.queryAllByLabelText('Image Gallery Video')).toHaveLength(1);
    });
  });
});
