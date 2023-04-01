import React from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { act } from 'react-test-renderer';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import {
  generateGiphyAttachment,
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
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

const getComponent = (props: Partial<ImageGalleryContextValue>) => (
  <OverlayProvider>
    <ImageGalleryContext.Provider value={{ ...(props as unknown as ImageGalleryContextValue) }}>
      <ThemeProvider theme={defaultTheme}>
        <ImageGallery overlayOpacity={{ value: 1 } as SharedValue<number>} />
      </ThemeProvider>
    </ImageGalleryContext.Provider>
  </OverlayProvider>
);

describe('ImageGallery', () => {
  it('render image gallery component', async () => {
    const { queryAllByA11yLabel } = render(
      getComponent({
        messages: [
          generateMessage({
            attachments: [
              generateImageAttachment(),
              generateGiphyAttachment(),
              generateVideoAttachment({ type: 'video' }),
            ],
          }),
        ] as unknown as MessageType<DefaultStreamChatGenerics>[],
      }),
    );

    await waitFor(() => {
      expect(queryAllByA11yLabel('Image Item')).toHaveLength(2);
      expect(queryAllByA11yLabel('Image Gallery Video')).toHaveLength(1);
    });
  });

  it('handle handleLoad function when video item present and payload duration is available', async () => {
    const attachment = generateVideoAttachment({ type: 'video' });
    const message = generateMessage({
      attachments: [attachment],
    });
    const { getByA11yLabel } = render(
      getComponent({
        messages: [message] as unknown as MessageType<DefaultStreamChatGenerics>[],
      }),
    );

    const videoItemComponent = getByA11yLabel('Image Gallery Video');

    act(() => {
      fireEvent(
        videoItemComponent,
        'handleLoad',
        `photoId-${message.id}-${attachment.asset_url}`,
        10,
      );
    });

    const videoDurationComponent = getByA11yLabel('Video Duration');

    await waitFor(() => {
      expect(videoDurationComponent.children[0]).toBe('00:10');
    });
  });

  it('handle handleLoad function when video item present and payload duration is undefined', async () => {
    const { getByA11yLabel } = render(
      getComponent({
        messages: [
          generateMessage({
            attachments: [generateVideoAttachment({ type: 'video' })],
          }),
        ] as unknown as MessageType<DefaultStreamChatGenerics>[],
      }),
    );

    const videoItemComponent = getByA11yLabel('Image Gallery Video');

    act(() => {
      fireEvent(videoItemComponent, 'handleLoad', {
        duration: undefined,
      });
    });

    const videoDurationComponent = getByA11yLabel('Video Duration');
    await waitFor(() => {
      expect(videoDurationComponent.children[0]).toBe('00:00');
    });
  });

  it('handle handleProgress function when video item present and payload is well defined', async () => {
    const attachment = generateVideoAttachment({ type: 'video' });
    const message = generateMessage({
      attachments: [attachment],
    });

    const { getByA11yLabel } = render(
      getComponent({
        messages: [message] as unknown as MessageType<DefaultStreamChatGenerics>[],
      }),
    );

    const videoItemComponent = getByA11yLabel('Image Gallery Video');

    act(() => {
      fireEvent(
        videoItemComponent,
        'handleLoad',
        `photoId-${message.id}-${attachment.asset_url}`,
        10,
      );
      fireEvent(
        videoItemComponent,
        'handleProgress',
        `photoId-${message.id}-${attachment.asset_url}`,
        0.3,
      );
    });

    const progressDurationComponent = getByA11yLabel('Progress Duration');

    await waitFor(() => {
      expect(progressDurationComponent.children[0]).toBe('00:03');
    });
  });

  it('handle handleProgress function when video item present and payload is not defined', async () => {
    const { getByA11yLabel } = render(
      getComponent({
        messages: [
          generateMessage({
            attachments: [generateVideoAttachment({ type: 'video' })],
          }),
        ] as unknown as MessageType<DefaultStreamChatGenerics>[],
      }),
    );

    const videoItemComponent = getByA11yLabel('Image Gallery Video');

    act(() => {
      fireEvent(videoItemComponent, 'handleLoad', {
        duration: 10,
      });
      fireEvent(videoItemComponent, 'handleProgress', {
        currentTime: undefined,
        seekableDuration: undefined,
      });
    });

    const progressDurationComponent = getByA11yLabel('Progress Duration');

    await waitFor(() => {
      expect(progressDurationComponent.children[0]).toBe('00:00');
    });
  });

  it('handle handleEnd function when video item present', async () => {
    const attachment = generateVideoAttachment({ type: 'video' });
    const message = generateMessage({
      attachments: [attachment],
    });
    const { getByA11yLabel } = render(
      getComponent({
        messages: [message] as unknown as MessageType<DefaultStreamChatGenerics>[],
      }),
    );

    const videoItemComponent = getByA11yLabel('Image Gallery Video');

    act(() => {
      fireEvent(
        videoItemComponent,
        'handleLoad',
        `photoId-${message.id}-${attachment.asset_url}`,
        10,
      );
      fireEvent(videoItemComponent, 'handleEnd');
    });

    const progressDurationComponent = getByA11yLabel('Progress Duration');
    await waitFor(() => {
      expect(getByA11yLabel('Play Icon')).not.toBeUndefined();
      expect(progressDurationComponent.children[0]).toBe('00:10');
    });
  });
});
