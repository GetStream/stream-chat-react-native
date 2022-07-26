import React from 'react';

import { State } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { act } from 'react-test-renderer';

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
import { generateImageAttachment } from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import * as NativeUtils from '../../../native';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { MessageType } from '../../MessageList/hooks/useMessageList';
import { ImageGalleryOverlay } from '../components/ImageGalleryOverlay';

describe('ImageGalleryOverlay', () => {
  jest.spyOn(NativeUtils, 'isVideoPackageAvailable').mockImplementation(() => true);

  it('should have currentBottomSheetIndex as a prop', async () => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });
    const setOverlayMock = jest.fn();

    const { queryByTestId } = render(
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
            <ImageGalleryOverlay
              animatedBottomSheetIndex={{ value: 1 } as SharedValue<number>}
              closeGridView={jest.fn()}
              currentBottomSheetIndex={1}
            />
          </Chat>
        </ImageGalleryContext.Provider>
      </OverlayContext.Provider>,
    );

    await waitFor(() => {
      const view = queryByTestId('image-gallery-overlay');
      expect(view).not.toBeUndefined();
    });
  });

  it('should trigger tapEvent on handler state change', async () => {
    const closeGridViewMock = jest.fn();
    const chatClient = await getTestClientWithUser({ id: 'testID' });

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <ImageGalleryOverlay
          animatedBottomSheetIndex={{ value: 1 } as SharedValue<number>}
          closeGridView={closeGridViewMock}
          currentBottomSheetIndex={1}
        />
      </Chat>,
    );

    const view = getByTestId('image-gallery-overlay');

    act(() => {
      fireEvent(view, 'onHandlerStateChange', {
        nativeEvent: {
          state: State.END,
        },
      });
    });

    await waitFor(() => {
      expect(closeGridViewMock).toHaveBeenCalled();
    });
  });
});
