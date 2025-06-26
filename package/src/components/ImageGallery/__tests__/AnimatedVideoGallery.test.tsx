import React from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { AnimatedGalleryVideo, AnimatedGalleryVideoType } from '../components/AnimatedGalleryVideo';

const getComponent = (props: Partial<AnimatedGalleryVideoType>) => (
  <ThemeProvider theme={defaultTheme}>
    <AnimatedGalleryVideo {...(props as unknown as AnimatedGalleryVideoType)} />
  </ThemeProvider>
);

describe('ImageGallery', () => {
  it('render image gallery component with video rendered', () => {
    render(
      getComponent({
        offsetScale: { value: 1 } as SharedValue<number>,
        scale: { value: 1 } as SharedValue<number>,
        shouldRender: true,
        source: {
          uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        },
        translateX: { value: 1 } as SharedValue<number>,
      }),
    );
    expect(screen.queryAllByLabelText('Image Gallery Video')).toHaveLength(1);
  });

  it('render empty view when shouldRender is false', () => {
    render(
      getComponent({
        offsetScale: { value: 1 } as SharedValue<number>,
        scale: { value: 1 } as SharedValue<number>,
        shouldRender: false,
        translateX: { value: 1 } as SharedValue<number>,
      }),
    );

    expect(screen.getByLabelText('Empty View Image Gallery')).not.toBeUndefined();
  });

  it('trigger onEnd and onProgress events handlers of Video component', () => {
    const handleEndMock = jest.fn();
    const handleProgressMock = jest.fn();

    render(
      getComponent({
        handleEnd: handleEndMock,
        handleProgress: handleProgressMock,
        offsetScale: { value: 1 } as SharedValue<number>,
        scale: { value: 1 } as SharedValue<number>,
        shouldRender: true,
        source: {
          uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        },
        translateX: { value: 1 } as SharedValue<number>,
      }),
    );

    const videoComponent = screen.getByTestId('video-player');

    act(() => {
      fireEvent(videoComponent, 'onEnd');
      fireEvent(videoComponent, 'onProgress', { currentTime: 10, seekableDuration: 60 });
    });

    expect(handleEndMock).toHaveBeenCalled();
    expect(handleProgressMock).toHaveBeenCalled();
  });

  it('trigger onLoadStart event handler of Video component', () => {
    render(
      getComponent({
        offsetScale: { value: 1 } as SharedValue<number>,
        scale: { value: 1 } as SharedValue<number>,
        shouldRender: true,
        source: {
          uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        },
        translateX: { value: 1 } as SharedValue<number>,
      }),
    );

    const videoComponent = screen.getByTestId('video-player');
    const spinnerComponent = screen.queryByLabelText('Spinner');

    act(() => {
      fireEvent(videoComponent, 'onLoadStart');
    });
    expect(spinnerComponent?.props.style[1].opacity).toBe(1);
  });

  it('trigger onLoad event handler of Video component', () => {
    const handleLoadMock = jest.fn();

    render(
      getComponent({
        handleLoad: handleLoadMock,
        offsetScale: { value: 1 } as SharedValue<number>,
        scale: { value: 1 } as SharedValue<number>,
        shouldRender: true,
        source: {
          uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        },
        translateX: { value: 1 } as SharedValue<number>,
      }),
    );

    const videoComponent = screen.getByTestId('video-player');
    const spinnerComponent = screen.queryByLabelText('Spinner');

    act(() => {
      fireEvent(videoComponent, 'onLoad', { duration: 10 });
    });

    expect(handleLoadMock).toHaveBeenCalled();
    expect(spinnerComponent?.props.style[1].opacity).toBe(0);
  });

  it('trigger onBuffer event handler of Video component', () => {
    render(
      getComponent({
        offsetScale: { value: 1 } as SharedValue<number>,
        scale: { value: 1 } as SharedValue<number>,
        shouldRender: true,
        source: {
          uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        },
        translateX: { value: 1 } as SharedValue<number>,
      }),
    );

    const videoComponent = screen.getByTestId('video-player');
    const spinnerComponent = screen.queryByLabelText('Spinner');

    act(() => {
      fireEvent(videoComponent, 'onBuffer', {
        isBuffering: false,
      });
    });

    expect(spinnerComponent?.props.style[1].opacity).toBe(0);

    act(() => {
      fireEvent(videoComponent, 'onBuffer', {
        isBuffering: true,
      });
    });

    expect(spinnerComponent?.props.style[1].opacity).toBe(1);
  });
});
