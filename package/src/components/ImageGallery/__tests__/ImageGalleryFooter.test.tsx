import React from 'react';

import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { ReactTestInstance } from 'react-test-renderer';

import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { Chat } from '../../../components/Chat/Chat';
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
import { getTestClientWithUser } from '../../../mock-builders/mock';
import * as NativeUtils from '../../../native';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { MessageType } from '../../MessageList/hooks/useMessageList';
import { ImageGallery, ImageGalleryCustomComponents } from '../ImageGallery';

jest.mock('../../../native.ts', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    deleteFile: jest.fn(),
    isImageMediaLibraryAvailable: jest.fn(() => true),
    isVideoPackageAvailable: jest.fn(() => true),
    NetInfo: {
      addEventListener: jest.fn(),
      fetch: jest.fn(),
    },
    saveFile: jest.fn(),
    shareImage: jest.fn(),
    Video: View,
  };
});

describe('ImageGalleryFooter', () => {
  it('render image gallery footer component with custom component footer props', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

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
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              messages: [
                generateMessage({
                  attachments: [generateVideoAttachment({ type: 'video' })],
                }),
              ] as unknown as MessageType<DefaultStreamChatGenerics>[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery
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
      expect(screen.queryAllByText('Video Control element')).toHaveLength(1);
    });
  });

  it('render image gallery footer component with custom component footer Grid Icon and Share Icon component', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

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
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              messages: [
                generateMessage({
                  attachments: [generateVideoAttachment({ type: 'video' })],
                }),
              ] as unknown as MessageType<DefaultStreamChatGenerics>[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery
              imageGalleryCustomComponents={
                {
                  footer: {
                    GridIcon: <CustomGridIconElement />,
                    ShareIcon: <CustomShareIconElement />,
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
      expect(screen.queryAllByText('Share Icon element')).toHaveLength(1);
      expect(screen.queryAllByText('Grid Icon element')).toHaveLength(1);
    });
  });

  it('should trigger the share button onPress Handler', async () => {
    const user = userEvent.setup();
    const chatClient = await getTestClientWithUser({ id: 'testID' });
    const saveFileMock = jest.spyOn(NativeUtils, 'saveFile');
    const shareImageMock = jest.spyOn(NativeUtils, 'shareImage');
    const deleteFileMock = jest.spyOn(NativeUtils, 'deleteFile');

    render(
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              messages: [
                generateMessage({
                  attachments: [generateImageAttachment()],
                }),
              ] as unknown as MessageType<DefaultStreamChatGenerics>[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery overlayOpacity={{ value: 1 } as SharedValue<number>} />
          </Chat>
        </ImageGalleryContext.Provider>
      </OverlayProvider>,
    );

    await waitFor(() => {
      user.press(screen.queryByLabelText('Share Button') as ReactTestInstance);
    });

    await waitFor(() => {
      expect(saveFileMock).toHaveBeenCalled();
      expect(shareImageMock).toHaveBeenCalled();
      expect(deleteFileMock).toHaveBeenCalled();
    });
  });
});
