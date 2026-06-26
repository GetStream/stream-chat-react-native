import React, { useEffect, useState } from 'react';
import { I18nManager, StyleSheet } from 'react-native';

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
        value={
          {
            imageGalleryStateStore,
          } as unknown as ImageGalleryContextValue
        }
      >
        <ImageGallery {...props} />
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

describe('ImageGallery', () => {
  const originalIsRTL = I18nManager.isRTL;

  const setRTL = (value: boolean) => {
    Object.defineProperty(I18nManager, 'isRTL', {
      configurable: true,
      value,
    });
  };

  afterEach(() => {
    setRTL(originalIsRTL);
  });

  it('render image gallery component', async () => {
    render(
      <ImageGalleryComponent
        message={generateMessage({
          // Video is placed at index 1 so it sits within the video-slide
          // window (`shouldRender < 2`) — at index 2 it would render as a
          // spacer instead of <AnimatedGalleryVideo>.
          attachments: [
            generateImageAttachment(),
            generateVideoAttachment({ type: 'video' }),
            generateGiphyAttachment(),
          ],
        })}
      />,
    );

    await waitFor(() => {
      // The pager subtree is marked `accessibilityElementsHidden` /
      // `importantForAccessibility='no-hide-descendants'` so screen readers
      // can't land on the silent shadow views inside it; the queries here
      // opt back into hidden elements so tests can still find the assets.
      expect(
        screen.queryAllByLabelText('Image Item', { includeHiddenElements: true }),
      ).toHaveLength(2);
      expect(
        screen.queryAllByLabelText('Image Gallery Video', { includeHiddenElements: true }),
      ).toHaveLength(1);
    });
  });

  it('keeps the pager in ltr coordinates when rtl is enabled', async () => {
    setRTL(true);

    render(
      <ImageGalleryComponent
        message={generateMessage({
          attachments: [generateImageAttachment()],
        })}
      />,
    );

    await waitFor(() => {
      const pagerStyle = StyleSheet.flatten(
        screen.getByTestId('image-gallery-pager', { includeHiddenElements: true }).props.style,
      );
      expect(pagerStyle.direction).toBe('ltr');
    });
  });
});
