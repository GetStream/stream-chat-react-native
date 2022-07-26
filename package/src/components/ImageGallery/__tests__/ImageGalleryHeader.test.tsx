import React from 'react';

import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { act, ReactTestInstance } from 'react-test-renderer';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

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
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { MessageType } from '../../MessageList/hooks/useMessageList';
import { ImageGallery, ImageGalleryCustomComponents } from '../ImageGallery';

jest.mock('../../../native.ts', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    isVideoPackageAvailable: jest.fn(() => true),
    NetInfo: {
      addEventListener: jest.fn(),
    },
    Video: View,
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

    const { queryAllByText } = render(
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              images: [
                generateMessage({
                  attachments: [generateImageAttachment()],
                }),
              ] as unknown as MessageType<DefaultStreamChatGenerics>[],
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
    expect(queryAllByText('Left element')).toHaveLength(1);
    expect(queryAllByText('Right element')).toHaveLength(1);
    expect(queryAllByText('Center element')).toHaveLength(1);
  });

  it('render image gallery header component with custom Close Icon component', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

    const CustomCloseIconElement = () => (
      <View>
        <Text>Close Icon element</Text>
      </View>
    );

    const { queryAllByText } = render(
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              images: [
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
    expect(queryAllByText('Close Icon element')).toHaveLength(1);
  });

  it('should trigger the hideOverlay function on button onPress', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });
    const setOverlayMock = jest.fn();

    const { queryByA11yLabel } = render(
      <OverlayContext.Provider
        value={{ setOverlay: setOverlayMock } as unknown as OverlayContextValue}
      >
        <ImageGalleryContext.Provider
          value={
            {
              images: [
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
      </OverlayContext.Provider>,
    );

    act(() => {
      fireEvent(queryByA11yLabel('Hide Overlay') as ReactTestInstance, 'onPress');
    });

    await waitFor(() => {
      expect(setOverlayMock).toHaveBeenCalledWith('none');
    });
  });
});
