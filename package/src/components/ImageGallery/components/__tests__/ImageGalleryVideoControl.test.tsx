import React from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../../contexts/imageGalleryContext/ImageGalleryContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { ImageGalleryStateStore } from '../../../../state-store/image-gallery-state-store';
import { ImageGalleryVideoControl } from '../ImageGalleryVideoControl';

dayjs.extend(duration);

// Replace ProgressControl with a lightweight stand-in that surfaces the seek
// callbacks as pressables. This lets us exercise the seek wiring (the fix for
// GH #3419) without a gesture-handler test harness. If the control ever stops
// passing onStartDrag/onEndDrag, these presses become no-ops and the
// assertions below fail.
jest.mock('../../../ProgressControl/ProgressControl', () => {
  const { Pressable } = require('react-native');
  return {
    ProgressControl: ({
      onStartDrag,
      onEndDrag,
    }: {
      onEndDrag?: (progress: number) => void;
      onStartDrag?: (progress: number) => void;
    }) => (
      <>
        <Pressable accessibilityLabel='start-drag' onPress={() => onStartDrag?.(0.5)} />
        <Pressable accessibilityLabel='end-drag' onPress={() => onEndDrag?.(0.5)} />
      </>
    ),
  };
});

const ATTACHMENT_ID = 'video-attachment-1';
const DURATION = 10000;

const setup = () => {
  const store = new ImageGalleryStateStore();
  const videoPlayer = store.videoPlayerPool.getOrAddPlayer({ id: ATTACHMENT_ID });
  videoPlayer.duration = DURATION;

  const seekSpy = jest.spyOn(videoPlayer, 'seek').mockImplementation(() => {});
  const playSpy = jest.spyOn(videoPlayer, 'play').mockImplementation(() => {});
  const pauseSpy = jest.spyOn(videoPlayer, 'pause').mockImplementation(() => {});

  render(
    <ThemeProvider theme={defaultTheme}>
      <ImageGalleryContext.Provider
        value={{ imageGalleryStateStore: store } as unknown as ImageGalleryContextValue}
      >
        <ImageGalleryVideoControl attachmentId={ATTACHMENT_ID} />
      </ImageGalleryContext.Provider>
    </ThemeProvider>,
  );

  return { pauseSpy, playSpy, seekSpy, videoPlayer };
};

describe('ImageGalleryVideoControl', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('seeks to the dragged position (progress * duration in ms)', () => {
    const { seekSpy } = setup();

    fireEvent.press(screen.getByLabelText('start-drag'));
    fireEvent.press(screen.getByLabelText('end-drag'));

    expect(seekSpy).toHaveBeenCalledWith(0.5 * DURATION);
  });

  it('pauses while scrubbing and resumes when it was playing before the drag', () => {
    const { pauseSpy, playSpy, seekSpy, videoPlayer } = setup();
    act(() => {
      videoPlayer.isPlaying = true;
    });

    fireEvent.press(screen.getByLabelText('start-drag'));
    expect(pauseSpy).toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('end-drag'));
    expect(seekSpy).toHaveBeenCalledWith(0.5 * DURATION);
    expect(playSpy).toHaveBeenCalled();
  });

  it('does not resume playback when it was paused before the drag', () => {
    const { playSpy, seekSpy, videoPlayer } = setup();
    act(() => {
      videoPlayer.isPlaying = false;
    });

    fireEvent.press(screen.getByLabelText('start-drag'));
    fireEvent.press(screen.getByLabelText('end-drag'));

    expect(seekSpy).toHaveBeenCalledWith(0.5 * DURATION);
    expect(playSpy).not.toHaveBeenCalled();
  });
});
