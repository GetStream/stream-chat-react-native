import React from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { act } from 'react-test-renderer';

import { fireEvent, render } from '@testing-library/react-native';

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
  it('render image gallery component', () => {
    const { queryAllByA11yLabel } = render(
      getComponent({
        images: [
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
    expect(queryAllByA11yLabel('image-item')).toHaveLength(2);
    expect(queryAllByA11yLabel('image-gallery-video')).toHaveLength(1);
  });

  it('handle handleLoad function when video item present', () => {
    const { getByA11yLabel } = render(
      getComponent({
        images: [
          generateMessage({
            attachments: [generateVideoAttachment({ type: 'video' })],
          }),
        ] as unknown as MessageType<DefaultStreamChatGenerics>[],
      }),
    );

    const videoItemComponent = getByA11yLabel('image-gallery-video');

    act(() => {
      fireEvent(videoItemComponent, 'handleLoad', {
        duration: 10,
      });
    });

    const videoDurationComponent = getByA11yLabel('video-duration');
    expect(videoDurationComponent.children[0]).toBe('00:10');
  });

  it('handle handleProgress function when video item present', () => {
    const { getByA11yLabel } = render(
      getComponent({
        images: [
          generateMessage({
            attachments: [generateVideoAttachment({ type: 'video' })],
          }),
        ] as unknown as MessageType<DefaultStreamChatGenerics>[],
      }),
    );

    const videoItemComponent = getByA11yLabel('image-gallery-video');

    act(() => {
      fireEvent(videoItemComponent, 'handleLoad', {
        duration: 10,
      });
      fireEvent(videoItemComponent, 'handleProgress', {
        currentTime: 3,
        seekableDuration: 10,
      });
    });

    const progressDurationComponent = getByA11yLabel('progress-duration');

    expect(progressDurationComponent.children[0]).toBe('00:03');
  });

  it('handle handleEnd function when video item present', () => {
    const { getByA11yLabel } = render(
      getComponent({
        images: [
          generateMessage({
            attachments: [generateVideoAttachment({ type: 'video' })],
          }),
        ] as unknown as MessageType<DefaultStreamChatGenerics>[],
      }),
    );

    const videoItemComponent = getByA11yLabel('image-gallery-video');

    act(() => {
      fireEvent(videoItemComponent, 'handleLoad', {
        duration: 10,
      });
      fireEvent(videoItemComponent, 'handleEnd');
    });

    const progressDurationComponent = getByA11yLabel('progress-duration');
    expect(getByA11yLabel('play-icon')).not.toBeUndefined();
    expect(progressDurationComponent.children[0]).toBe('00:10');
  });
});
