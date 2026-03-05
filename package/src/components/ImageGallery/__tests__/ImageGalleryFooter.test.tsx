import React, { useEffect, useState } from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { Attachment, LocalMessage } from 'stream-chat';

import { ImageGalleryFooter as ImageGalleryFooterDefault } from '../../../components/ImageGallery/components/ImageGalleryFooter';
import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { NativeHandlers } from '../../../native';
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
      deleteFile: jest.fn(),
      saveFile: jest.fn(),
      shareImage: jest.fn(),
      Video: View,
    },
  };
});

const ImageGalleryComponentVideo = (props: ImageGalleryProps) => {
  const [imageGalleryStateStore] = useState(() => new ImageGalleryStateStore());

  useEffect(() => {
    const unsubscribe = imageGalleryStateStore.registerSubscriptions();

    return () => {
      unsubscribe();
    };
  }, [imageGalleryStateStore]);

  const attachment = generateVideoAttachment({ type: 'video' });
  imageGalleryStateStore.openImageGallery({
    messages: [
      generateMessage({
        attachments: [attachment],
      }) as unknown as LocalMessage,
    ],
    selectedAttachmentUrl: attachment.asset_url,
  });

  return (
    <OverlayProvider value={{ overlayOpacity: { value: 1 } as SharedValue<number> }}>
      <ImageGalleryContext.Provider
        value={
          {
            imageGalleryStateStore,
            ImageGalleryFooter: ImageGalleryFooterDefault,
          } as unknown as ImageGalleryContextValue
        }
      >
        <ImageGallery {...props} />
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

const ImageGalleryComponentImage = (
  props: ImageGalleryProps & {
    attachment: Attachment;
  },
) => {
  const [imageGalleryStateStore] = useState(() => new ImageGalleryStateStore());

  useEffect(() => {
    const unsubscribe = imageGalleryStateStore.registerSubscriptions();

    return () => {
      unsubscribe();
    };
  }, [imageGalleryStateStore]);

  imageGalleryStateStore.openImageGallery({
    messages: [
      generateMessage({
        attachments: [props.attachment],
      }) as unknown as LocalMessage,
    ],
    selectedAttachmentUrl: props.attachment.image_url as string,
  });

  return (
    <OverlayProvider value={{ overlayOpacity: { value: 1 } as SharedValue<number> }}>
      <ImageGalleryContext.Provider
        value={
          {
            imageGalleryStateStore,
            ImageGalleryFooter: ImageGalleryFooterDefault,
          } as unknown as ImageGalleryContextValue
        }
      >
        <ImageGallery {...props} />
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

describe('ImageGalleryFooter', () => {
  it('render image gallery footer component with default footer elements', async () => {
    render(<ImageGalleryComponentVideo />);

    await waitFor(() => {
      expect(screen.getByLabelText('Share Button')).toBeTruthy();
      expect(screen.getByLabelText('Center element')).toBeTruthy();
      expect(screen.getByLabelText('Grid Icon')).toBeTruthy();
    });
  });

  it('render image gallery footer component with Share Button and Grid Icon', async () => {
    render(<ImageGalleryComponentVideo />);

    await waitFor(() => {
      expect(screen.getByLabelText('Share Button')).toBeTruthy();
      expect(screen.getByLabelText('Grid Icon')).toBeTruthy();
    });
  });

  it('should trigger the share button onPress Handler with local attachment and no mime_type', async () => {
    const user = userEvent.setup();
    const saveFileMock = jest.spyOn(NativeHandlers, 'saveFile');
    const shareImageMock = jest.spyOn(NativeHandlers, 'shareImage');
    const deleteFileMock = jest.spyOn(NativeHandlers, 'deleteFile');

    const attachment = generateImageAttachment();

    render(<ImageGalleryComponentImage attachment={attachment} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Share Button')).toBeTruthy();
    });

    await user.press(screen.getByLabelText('Share Button'));

    await waitFor(() => {
      expect(saveFileMock).not.toHaveBeenCalled();
      expect(shareImageMock).toHaveBeenCalledWith({
        type: 'image/jpeg',
        url: attachment.image_url,
      });
      expect(deleteFileMock).not.toHaveBeenCalled();
    });
  });

  it('should trigger the share button onPress Handler with local attachment and existing mime_type', async () => {
    const user = userEvent.setup();
    const saveFileMock = jest.spyOn(NativeHandlers, 'saveFile');
    const shareImageMock = jest.spyOn(NativeHandlers, 'shareImage');
    const deleteFileMock = jest.spyOn(NativeHandlers, 'deleteFile');

    const attachment = { ...generateImageAttachment(), mime_type: 'image/png' };

    render(<ImageGalleryComponentImage attachment={attachment} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Share Button')).toBeTruthy();
    });

    await user.press(screen.getByLabelText('Share Button'));

    await waitFor(() => {
      expect(saveFileMock).not.toHaveBeenCalled();
      expect(shareImageMock).toHaveBeenCalledWith({
        type: 'image/png',
        url: attachment.image_url,
      });
      expect(deleteFileMock).not.toHaveBeenCalled();
    });
  });

  it('should trigger the share button onPress Handler with cdn attachment', async () => {
    const user = userEvent.setup();
    const saveFileMock = jest
      .spyOn(NativeHandlers, 'saveFile')
      .mockResolvedValue('file:///local/asset/url');
    const shareImageMock = jest.spyOn(NativeHandlers, 'shareImage');
    const deleteFileMock = jest.spyOn(NativeHandlers, 'deleteFile');

    const attachment = {
      ...generateImageAttachment(),
      image_url: 'https://my-image-service/image/123456',
      mime_type: 'image/png',
    };

    render(<ImageGalleryComponentImage attachment={attachment} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Share Button')).toBeTruthy();
    });

    await user.press(screen.getByLabelText('Share Button'));

    await waitFor(() => {
      expect(saveFileMock).toHaveBeenCalled();
      expect(shareImageMock).toHaveBeenCalledWith({
        type: 'image/png',
        url: 'file:///local/asset/url',
      });
      expect(deleteFileMock).toHaveBeenCalled();
    });
  });
});
