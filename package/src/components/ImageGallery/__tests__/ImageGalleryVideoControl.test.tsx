import React from 'react';

import { ReactTestInstance } from 'react-test-renderer';

import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import type { ImageGalleryFooterVideoControlProps } from '../components/ImageGalleryFooter';
import { ImageGalleryVideoControl } from '../components/ImageGalleryVideoControl';

dayjs.extend(duration);

const getComponent = (props: Partial<ImageGalleryFooterVideoControlProps>) => (
  <ThemeProvider theme={defaultTheme}>
    <ImageGalleryVideoControl {...(props as unknown as ImageGalleryFooterVideoControlProps)} />
  </ThemeProvider>
);

describe('ImageGalleryOverlay', () => {
  it('should trigger the onPlayPause when play/pause button is pressed', async () => {
    const onPlayPauseMock = jest.fn();
    const user = userEvent.setup();

    render(getComponent({ onPlayPause: onPlayPauseMock }));

    const component = screen.queryByLabelText('Play Pause Button') as ReactTestInstance;

    act(() => {
      user.press(component);
    });

    await waitFor(() => {
      expect(component).not.toBeUndefined();
      expect(onPlayPauseMock).toHaveBeenCalled();
    });
  });

  it('should render the play icon when paused prop is true', async () => {
    render(getComponent({ paused: true }));

    const components = screen.queryAllByLabelText('Play Icon').length;

    await waitFor(() => {
      expect(components).toBeGreaterThan(0);
    });
  });

  it('should calculate the videoDuration and progressDuration when they are greater than or equal to 3600', () => {
    jest.spyOn(dayjs, 'duration');

    render(
      getComponent({
        duration: 3600 * 1000,
        progress: 1,
      }),
    );

    const videoDurationComponent = screen.queryByLabelText('Video Duration') as ReactTestInstance;
    const progressDurationComponent = screen.queryByLabelText(
      'Progress Duration',
    ) as ReactTestInstance;

    expect(videoDurationComponent.children[0]).toBe('01:00:00');
    expect(progressDurationComponent.children[0]).toBe('01:00:00');
  });

  it('should calculate the videoDuration and progressDuration when they are less than 3600', () => {
    jest.spyOn(dayjs, 'duration');

    render(
      getComponent({
        duration: 60 * 1000,
        progress: 0.5,
      }),
    );

    const videoDurationComponent = screen.queryByLabelText('Video Duration') as ReactTestInstance;
    const progressDurationComponent = screen.queryByLabelText(
      'Progress Duration',
    ) as ReactTestInstance;

    expect(videoDurationComponent.children[0]).toBe('01:00');
    expect(progressDurationComponent.children[0]).toBe('00:30');
  });
});
