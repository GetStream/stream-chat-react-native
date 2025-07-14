import React from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { LocalMessage } from 'stream-chat';

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

import { ImageGallery } from '../ImageGallery';

dayjs.extend(duration);

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
    render(
      getComponent({
        messages: [
          generateMessage({
            attachments: [
              generateImageAttachment(),
              generateGiphyAttachment(),
              generateVideoAttachment({ type: 'video' }),
            ],
          }),
        ] as unknown as LocalMessage[],
      }),
    );

    await waitFor(() => {
      expect(screen.queryAllByLabelText('Image Item')).toHaveLength(2);
      expect(screen.queryAllByLabelText('Image Gallery Video')).toHaveLength(1);
    });
  });

  it('handle handleLoad function when video item present and payload duration is available', async () => {
    const attachment = generateVideoAttachment({ type: 'video' });
    const message = generateMessage({
      attachments: [attachment],
    });
    render(
      getComponent({
        messages: [message] as unknown as LocalMessage[],
      }),
    );

    const videoItemComponent = screen.getByLabelText('Image Gallery Video');

    act(() => {
      fireEvent(
        videoItemComponent,
        'handleLoad',
        `photoId-${message.id}-${attachment.asset_url}`,
        10 * 1000,
      );
    });

    const videoDurationComponent = screen.getByLabelText('Video Duration');

    await waitFor(() => {
      expect(videoDurationComponent.children[0]).toBe('00:10');
    });
  });

  it('handle handleLoad function when video item present and payload duration is undefined', async () => {
    render(
      getComponent({
        messages: [
          generateMessage({
            attachments: [generateVideoAttachment({ type: 'video' })],
          }),
        ] as unknown as LocalMessage[],
      }),
    );

    const videoItemComponent = screen.getByLabelText('Image Gallery Video');

    act(() => {
      fireEvent(videoItemComponent, 'handleLoad', {
        duration: undefined,
      });
    });

    const videoDurationComponent = screen.getByLabelText('Video Duration');
    await waitFor(() => {
      expect(videoDurationComponent.children[0]).toBe('00:00');
    });
  });

  it('handle handleProgress function when video item present and payload is well defined', async () => {
    const attachment = generateVideoAttachment({ type: 'video' });
    const message = generateMessage({
      attachments: [attachment],
    });

    render(
      getComponent({
        messages: [message] as unknown as LocalMessage[],
      }),
    );

    const videoItemComponent = screen.getByLabelText('Image Gallery Video');

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
        0.3 * 1000,
      );
    });

    const progressDurationComponent = screen.getByLabelText('Progress Duration');

    await waitFor(() => {
      expect(progressDurationComponent.children[0]).toBe('00:03');
    });
  });

  it('handle handleProgress function when video item present and payload is not defined', async () => {
    render(
      getComponent({
        messages: [
          generateMessage({
            attachments: [generateVideoAttachment({ type: 'video' })],
          }),
        ] as unknown as LocalMessage[],
      }),
    );

    const videoItemComponent = screen.getByLabelText('Image Gallery Video');

    act(() => {
      fireEvent(videoItemComponent, 'handleLoad', {
        duration: 10 * 1000,
      });
      fireEvent(videoItemComponent, 'handleProgress', {
        currentTime: undefined,
        seekableDuration: undefined,
      });
    });

    const progressDurationComponent = screen.getByLabelText('Progress Duration');

    await waitFor(() => {
      expect(progressDurationComponent.children[0]).toBe('00:00');
    });
  });

  it('handle handleEnd function when video item present', async () => {
    const attachment = generateVideoAttachment({ type: 'video' });
    const message = generateMessage({
      attachments: [attachment],
    });
    render(
      getComponent({
        messages: [message] as unknown as LocalMessage[],
      }),
    );

    const videoItemComponent = screen.getByLabelText('Image Gallery Video');

    act(() => {
      fireEvent(
        videoItemComponent,
        'handleLoad',
        `photoId-${message.id}-${attachment.asset_url}`,
        10 * 1000,
      );
      fireEvent(videoItemComponent, 'handleEnd');
    });

    const progressDurationComponent = screen.getByLabelText('Progress Duration');
    await waitFor(() => {
      expect(screen.queryAllByLabelText('Play Icon').length).toBeGreaterThan(0);
      expect(progressDurationComponent.children[0]).toBe('00:10');
    });
  });
});
