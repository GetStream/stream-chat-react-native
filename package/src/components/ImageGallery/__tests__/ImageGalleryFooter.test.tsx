import React from 'react';

import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

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
import { NativeHandlers } from '../../../native';
import { ImageGallery, ImageGalleryCustomComponents } from '../ImageGallery';

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
              ] as unknown as LocalMessage[],
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
              ] as unknown as LocalMessage[],
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

  it('should trigger the share button onPress Handler with local attachment and no mime_type', async () => {
    const user = userEvent.setup();
    const chatClient = await getTestClientWithUser({ id: 'testID' });
    const saveFileMock = jest.spyOn(NativeHandlers, 'saveFile');
    const shareImageMock = jest.spyOn(NativeHandlers, 'shareImage');
    const deleteFileMock = jest.spyOn(NativeHandlers, 'deleteFile');

    const attachment = generateImageAttachment();

    render(
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              messages: [
                generateMessage({
                  attachments: [attachment],
                }),
              ] as unknown as LocalMessage[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery overlayOpacity={{ value: 1 } as SharedValue<number>} />
          </Chat>
        </ImageGalleryContext.Provider>
      </OverlayProvider>,
    );

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
    const chatClient = await getTestClientWithUser({ id: 'testID' });
    const saveFileMock = jest.spyOn(NativeHandlers, 'saveFile');
    const shareImageMock = jest.spyOn(NativeHandlers, 'shareImage');
    const deleteFileMock = jest.spyOn(NativeHandlers, 'deleteFile');

    const attachment = { ...generateImageAttachment(), mime_type: 'image/png' };

    render(
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              messages: [
                generateMessage({
                  attachments: [attachment],
                }),
              ] as unknown as LocalMessage[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery overlayOpacity={{ value: 1 } as SharedValue<number>} />
          </Chat>
        </ImageGalleryContext.Provider>
      </OverlayProvider>,
    );

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
    const chatClient = await getTestClientWithUser({ id: 'testID' });
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

    render(
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              messages: [
                generateMessage({
                  attachments: [attachment],
                }),
              ] as unknown as LocalMessage[],
            } as unknown as ImageGalleryContextValue
          }
        >
          <Chat client={chatClient}>
            <ImageGallery overlayOpacity={{ value: 1 } as SharedValue<number>} />
          </Chat>
        </ImageGalleryContext.Provider>
      </OverlayProvider>,
    );

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
