import React from 'react';

import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import { Chat } from '../../../components/Chat/Chat';
import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import {
  OverlayContext,
  OverlayContextValue,
} from '../../../contexts/overlayContext/OverlayContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { getTestClientWithUser } from '../../../mock-builders/mock';

import { ImageGallery, ImageGalleryCustomComponents } from '../ImageGallery';

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

describe('ImageGalleryHeader', () => {
  it('render image gallery header component with custom component header props', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

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
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              messages: [
                generateMessage({
                  attachments: [generateImageAttachment()],
                }),
              ] as unknown as LocalMessage[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery
              imageGalleryCustomComponents={
                {
                  header: {
                    centerElement: CustomHeaderCenterElement,
                    leftElement: CustomHeaderLeftElement,
                    rightElement: CustomHeaderRightElement,
                  },
                } as ImageGalleryCustomComponents['imageGalleryCustomComponents']
              }
              overlayOpacity={{ value: 1 } as SharedValue<number>}
            />
          </Chat>
        </ImageGalleryContext.Provider>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Left element')).toHaveLength(1);
      expect(screen.queryAllByText('Right element')).toHaveLength(1);
      expect(screen.queryAllByText('Center element')).toHaveLength(1);
    });
  });

  it('render image gallery header component with custom Close Icon component', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

    const CustomCloseIconElement = () => (
      <View>
        <Text>Close Icon element</Text>
      </View>
    );

    render(
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              messages: [
                generateMessage({
                  attachments: [generateVideoAttachment({ type: 'video' })],
                }),
              ] as unknown as LocalMessage[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery
              imageGalleryCustomComponents={
                {
                  header: {
                    CloseIcon: <CustomCloseIconElement />,
                  },
                } as ImageGalleryCustomComponents['imageGalleryCustomComponents']
              }
              overlayOpacity={{ value: 1 } as SharedValue<number>}
            />
          </Chat>
        </ImageGalleryContext.Provider>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(screen.queryAllByText('Close Icon element')).toHaveLength(1);
    });
  });

  it('should trigger the hideOverlay function on button onPress', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });
    const setOverlayMock = jest.fn();
    const user = userEvent.setup();

    render(
      <OverlayContext.Provider
        value={{ setOverlay: setOverlayMock } as unknown as OverlayContextValue}
      >
        <ImageGalleryContext.Provider
          value={
            {
              messages: [
                generateMessage({
                  attachments: [generateImageAttachment()],
                }),
              ] as unknown as LocalMessage[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery overlayOpacity={{ value: 1 } as SharedValue<number>} />
          </Chat>
        </ImageGalleryContext.Provider>
      </OverlayContext.Provider>,
    );

    act(() => {
      user.press(screen.getByLabelText('Hide Overlay'));
    });

    await waitFor(() => {
      expect(setOverlayMock).toHaveBeenCalledWith('none');
    });
  });
});
