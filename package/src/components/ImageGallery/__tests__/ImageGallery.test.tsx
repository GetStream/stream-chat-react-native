import React from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { render } from '@testing-library/react-native';

import { Chat } from '../../../components/Chat/Chat';
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
import { getTestClientWithUser } from '../../../mock-builders/mock';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { MessageType } from '../../MessageList/hooks/useMessageList';
import { ImageGallery } from '../ImageGallery';

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

describe('ImageGallery', () => {
  it('render image gallery component', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

    const { queryAllByA11yLabel } = render(
      <OverlayProvider>
        <ImageGalleryContext.Provider
          value={
            {
              images: [
                generateMessage({
                  attachments: [
                    generateImageAttachment(),
                    generateGiphyAttachment(),
                    generateVideoAttachment({ type: 'video' }),
                  ],
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
    expect(queryAllByA11yLabel('image-gallery')).toHaveLength(1);
  });
});
