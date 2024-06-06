import React from 'react';

import { act } from 'react-test-renderer';

import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  MessageInputContext,
  MessageInputContextValue,
} from '../../../contexts/messageInputContext/MessageInputContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';

import { generateFileUploadPreview } from '../../../mock-builders/generator/attachment';
import type { FileUpload } from '../../../types/types';
import { AudioAttachment, AudioAttachmentProps } from '../../Attachment/AudioAttachment';

jest.mock('../../../native.ts', () => ({
  isAudioPackageAvailable: jest.fn(() => true),
  NetInfo: {
    addEventListener: jest.fn(),
  },
  Sound: {
    initializeSound: jest.fn(),
    Player: null,
  },
}));

jest.mock('react-native/Libraries/ReactNative/I18nManager', () => ({
  isRTL: true,
}));

const getComponent = (
  props: Partial<AudioAttachmentProps & Pick<MessageInputContextValue, 'fileUploads'>>,
) => (
  <ThemeProvider theme={defaultTheme}>
    <MessageInputContext.Provider
      value={{ fileUploads: props.fileUploads } as unknown as MessageInputContextValue}
    >
      <AudioAttachment {...(props as unknown as AudioAttachmentProps)} />,
    </MessageInputContext.Provider>
  </ThemeProvider>
);

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('AudioAttachmentExpo', () => {
  it('handle play pause button when isPausedStatusAvailable unavailable and progress 1', () => {
    const setPositionAsyncMock = jest.fn();
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        setPositionAsync: setPositionAsyncMock,
      },
    });

    const onPlayPauseMock = jest.fn();
    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: {
          file: { name: 'audio.mp3', uri: 'https://www.test.com/audio.mp3' },
          paused: true,
          progress: 1,
        } as unknown as FileUpload,
        onPlayPause: onPlayPauseMock,
      }),
    );

    const playPauseButton = screen.getByLabelText('Play Pause Button');

    act(() => {
      fireEvent(playPauseButton, 'onPress');
    });
    expect(setPositionAsyncMock).toHaveBeenCalled();
  });

  it('handle initial paused state', () => {
    const pauseAsyncMock = jest.fn();
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        pauseAsync: pauseAsyncMock,
      },
    });

    const onPlayPauseMock = jest.fn();
    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: {
          file: { name: 'audio.mp3', uri: 'https://www.test.com/audio.mp3' },
          paused: true,
          progress: 1,
        } as unknown as FileUpload,
        onPlayPause: onPlayPauseMock,
      }),
    );

    const playPauseButton = screen.getByLabelText('Play Pause Button');

    act(() => {
      fireEvent(playPauseButton, 'onPress');
    });
    expect(pauseAsyncMock).toHaveBeenCalled();
  });

  it('handle initial play state', () => {
    const playAsyncMock = jest.fn();
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        playAsync: playAsyncMock,
      },
    });

    const onPlayPauseMock = jest.fn();
    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: {
          file: { name: 'audio.mp3', uri: 'https://www.test.com/audio.mp3' },
          paused: false,
          progress: 1,
        } as unknown as FileUpload,
        onPlayPause: onPlayPauseMock,
      }),
    );

    const playPauseButton = screen.getByLabelText('Play Pause Button');

    act(() => {
      fireEvent(playPauseButton, 'onPress');
    });

    expect(playAsyncMock).toHaveBeenCalled();
  });

  it('handle unmount', () => {
    const stopAsyncMock = jest.fn();
    const unloadAsyncMock = jest.fn();
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        stopAsync: stopAsyncMock,
        unloadAsync: unloadAsyncMock,
      },
    });

    const { unmount } = render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: {
          file: { name: 'audio.mp3', uri: 'https://www.test.com/audio.mp3' },
          paused: false,
          progress: 1,
        } as unknown as FileUpload,
      }),
    );

    unmount();

    expect(stopAsyncMock).toHaveBeenCalled();
    expect(unloadAsyncMock).toHaveBeenCalled();
  });

  it('render text in rtl mode', () => {
    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: {
          file: { name: 'audio.mp3', uri: 'https://www.test.com/audio.mp3' },
          progress: 1,
        } as unknown as FileUpload,
      }),
    );

    const textComponent = screen.getByLabelText('File Name');
    expect(textComponent?.props.style[2].writingDirection).toBe('rtl');
  });

  it('handle onProgressDrag event of the progress control', () => {
    const onProgressMock = jest.fn().mockImplementation((id, duration) => ({ duration, id }));
    const setPositionAsyncMock = jest.fn();

    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        setPositionAsync: setPositionAsyncMock,
      },
    });

    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: { file: { name: 'audio.mp3' }, paused: false } as unknown as FileUpload,
        onProgress: onProgressMock,
      }),
    );

    const progressControl = screen.getByTestId('progress-control');

    act(() => {
      fireEvent(progressControl, 'onProgressDrag', {
        currentTime: 10,
        seekableDuration: 10,
      });
    });

    expect(onProgressMock).toHaveBeenCalled();
    expect(setPositionAsyncMock).toHaveBeenCalled();
  });
});
