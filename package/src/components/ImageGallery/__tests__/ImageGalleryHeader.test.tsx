import React, { useEffect, useState } from 'react';

import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import * as overlayContext from '../../../contexts/overlayContext/OverlayContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { generateImageAttachment } from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';

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
      Video: View,
    },
  };
});

const ImageGalleryComponent = (props: ImageGalleryProps) => {
  const [imageGalleryStateStore] = useState(() => new ImageGalleryStateStore());
  const attachment = generateImageAttachment();
  imageGalleryStateStore.openImageGallery({
    messages: [generateMessage({ attachments: [attachment] }) as unknown as LocalMessage],
    selectedAttachmentUrl: attachment.url,
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
        value={{ imageGalleryStateStore } as unknown as ImageGalleryContextValue}
      >
        <ImageGallery {...props} />
      </ImageGalleryContext.Provider>
    </OverlayProvider>
  );
};

describe('ImageGalleryHeader', () => {
  it('render image gallery header component with custom component header props', async () => {
    const CustomHeaderLeftElement = () => (
      <View>
        <Text>Left element</Text>
      </View>
    );

    const CustomHeaderRightElement = () => (
      <View>
        <Text>Right element</Text>
      </View>
    );

    const CustomHeaderCenterElement = () => (
      <View>
        <Text>Center element</Text>
      </View>
    );

    render(
      <ImageGalleryComponent
        imageGalleryCustomComponents={
          {
            header: {
              centerElement: CustomHeaderCenterElement,
              leftElement: CustomHeaderLeftElement,
              rightElement: CustomHeaderRightElement,
            },
          } as ImageGalleryCustomComponents['imageGalleryCustomComponents']
        }
      />,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Left element')).toHaveLength(1);
      expect(screen.queryAllByText('Right element')).toHaveLength(1);
      expect(screen.queryAllByText('Center element')).toHaveLength(1);
    });
  });

  it('render image gallery header component with custom Close Icon component', async () => {
    const CustomCloseIconElement = () => (
      <View>
        <Text>Close Icon element</Text>
      </View>
    );

    render(
      <ImageGalleryComponent
        imageGalleryCustomComponents={
          {
            header: {
              CloseIcon: <CustomCloseIconElement />,
            },
          } as ImageGalleryCustomComponents['imageGalleryCustomComponents']
        }
      />,
    );
    await waitFor(() => {
      expect(screen.queryAllByText('Close Icon element')).toHaveLength(1);
    });
  });

  it('should trigger the hideOverlay function on button onPress', async () => {
    const setOverlayMock = jest.fn();
    const user = userEvent.setup();

    jest.spyOn(overlayContext, 'useOverlayContext').mockImplementation(() => ({
      setOverlay: setOverlayMock,
    }));

    render(<ImageGalleryComponent />);

    await act(() => {
      user.press(screen.getByLabelText('Hide Overlay'));
    });

    await waitFor(() => {
      expect(setOverlayMock).toHaveBeenCalledWith('none');
    });
  });
});
