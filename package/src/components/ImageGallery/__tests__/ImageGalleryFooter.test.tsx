import React, { useState } from 'react';

import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { Attachment, LocalMessage } from 'stream-chat';

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
import { ImageGallery, ImageGalleryCustomComponents, ImageGalleryProps } from '../ImageGallery';

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
  const initialImageGalleryStateStore = new ImageGalleryStateStore();
  const attachment = generateVideoAttachment({ type: 'video' });
  initialImageGalleryStateStore.openImageGallery({
    message: generateMessage({
      attachments: [attachment],
    }) as unknown as LocalMessage,
    selectedAttachmentUrl: attachment.url,
  });

  const [imageGalleryStateStore] = useState(initialImageGalleryStateStore);

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

const ImageGalleryComponentImage = (
  props: ImageGalleryProps & {
    attachment: Attachment;
  },
) => {
  const initialImageGalleryStateStore = new ImageGalleryStateStore();
  initialImageGalleryStateStore.openImageGallery({
    message: generateMessage({
      attachments: [props.attachment],
    }) as unknown as LocalMessage,
    selectedAttachmentUrl: props.attachment.image_url as string,
  });

  const [imageGalleryStateStore] = useState(initialImageGalleryStateStore);

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

describe('ImageGalleryFooter', () => {
  it('render image gallery footer component with custom component footer props', async () => {
    const CustomFooterLeftElement = () => (
      <View>
        <Text>Left element</Text>
      </View>
    );

    const CustomFooterRightElement = () => (
      <View>
        <Text>Right element</Text>
      </View>
    );

    const CustomFooterCenterElement = () => (
      <View>
        <Text>Center element</Text>
      </View>
    );

    const CustomFooterVideoControlElement = () => (
      <View>
        <Text>Video Control element</Text>
      </View>
    );

    render(
      <ImageGalleryComponentVideo
        imageGalleryCustomComponents={
          {
            footer: {
              centerElement: CustomFooterCenterElement,
              leftElement: CustomFooterLeftElement,
              rightElement: CustomFooterRightElement,
              videoControlElement: CustomFooterVideoControlElement,
            },
          } as ImageGalleryCustomComponents['imageGalleryCustomComponents']
        }
      />,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Left element')).toHaveLength(1);
      expect(screen.queryAllByText('Right element')).toHaveLength(1);
      expect(screen.queryAllByText('Center element')).toHaveLength(1);
      expect(screen.queryAllByText('Video Control element')).toHaveLength(1);
    });
  });

  it('render image gallery footer component with custom component footer Grid Icon and Share Icon component', async () => {
    const CustomShareIconElement = () => (
      <View>
        <Text>Share Icon element</Text>
      </View>
    );

    const CustomGridIconElement = () => (
      <View>
        <Text>Grid Icon element</Text>
      </View>
    );

    render(
      <ImageGalleryComponentVideo
        imageGalleryCustomComponents={
          {
            footer: {
              GridIcon: <CustomGridIconElement />,
              ShareIcon: <CustomShareIconElement />,
            },
          } as ImageGalleryCustomComponents['imageGalleryCustomComponents']
        }
        overlayOpacity={{ value: 1 } as SharedValue<number>}
      />,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Share Icon element')).toHaveLength(1);
      expect(screen.queryAllByText('Grid Icon element')).toHaveLength(1);
    });
  });

  it('should trigger the share button onPress Handler with local attachment and no mime_type', async () => {
    const user = userEvent.setup();
    const saveFileMock = jest.spyOn(NativeHandlers, 'saveFile');
    const shareImageMock = jest.spyOn(NativeHandlers, 'shareImage');
    const deleteFileMock = jest.spyOn(NativeHandlers, 'deleteFile');

    const attachment = generateImageAttachment();

    render(<ImageGalleryComponentImage attachment={attachment} />);

    const { getByLabelText } = screen;

    await waitFor(() => {
      user.press(getByLabelText('Share Button'));
    });

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

    const { getByLabelText } = screen;

    await waitFor(() => {
      user.press(getByLabelText('Share Button'));
    });

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

    const { getByLabelText } = screen;

    await waitFor(() => {
      user.press(getByLabelText('Share Button'));
    });

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
