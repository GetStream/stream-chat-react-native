import React from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  MessageInputContext,
  MessageInputContextValue,
} from '../../../contexts/messageInputContext/MessageInputContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';

import { generateFileUploadPreview } from '../../../mock-builders/generator/attachment';
import type { FileUpload } from '../../../types/types';
import { AudioAttachment, AudioAttachmentProps } from '../../Attachment/AudioAttachment';

jest.mock('../../../native.ts', () => {
  const View = require('react-native').View;

  return {
    isSoundPackageAvailable: jest.fn(() => true),
    Sound: {
      Player: View,
    },
  };
});

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

describe.skip('AudioAttachment', () => {
  it('handle play pause button when isPausedStatusAvailable unavailable and progress 1', () => {
    const seekMock = jest.fn();
    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        seek: seekMock,
      },
    });

    const onPlayPauseMock = jest.fn();
    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: { file: { name: 'audio.mp3' }, paused: true, progress: 1 } as unknown as FileUpload,
        onPlayPause: onPlayPauseMock,
      }),
    );

    const playPauseButton = screen.getByLabelText('Play Pause Button');
    fireEvent.press(playPauseButton);

    expect(seekMock).toHaveBeenCalled();
  });

  it('handle play pause button when isPausedStatusAvailable unavailable and paused equals true', () => {
    const playAsyncMock = jest.fn();
    const onPlayPauseMock = jest.fn((id, status) => ({ id, status }));

    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        playAsync: playAsyncMock,
      },
    });

    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: { file: { name: 'audio.mp3' }, paused: true } as unknown as FileUpload,
        onPlayPause: onPlayPauseMock,
      }),
    );

    const playPauseButton = screen.getByLabelText('Play Pause Button');

    act(() => {
      fireEvent.press(playPauseButton);
    });

    expect(playAsyncMock).toHaveBeenCalled();
  });

  it('handle play pause button when isPausedStatusAvailable unavailable and paused equals false', () => {
    const pauseAsyncMock = jest.fn();
    const onPlayPauseMock = jest.fn((id, status) => ({ id, status }));

    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        pauseAsync: pauseAsyncMock,
      },
    });

    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: { file: { name: 'audio.mp3' }, paused: false } as unknown as FileUpload,
        onPlayPause: onPlayPauseMock,
      }),
    );

    const playPauseButton = screen.getByLabelText('Play Pause Button');

    act(() => {
      fireEvent.press(playPauseButton);
    });

    expect(pauseAsyncMock).toHaveBeenCalled();
  });

  it('handle onLoad event of sound player', () => {
    const onLoadMock = jest.fn().mockImplementation((id, duration) => ({ duration, id }));

    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: { file: { name: 'audio.mp3' }, paused: false } as unknown as FileUpload,
        onLoad: onLoadMock,
      }),
    );

    const soundPlayer = screen.getByTestId('sound-player');

    act(() => {
      fireEvent(soundPlayer, 'onLoad', {
        duration: 100,
      });
    });

    expect(onLoadMock).toHaveBeenCalled();
  });

  it('handle onEnd event of sound player', () => {
    const onProgressMock = jest.fn().mockImplementation((id, duration) => ({ duration, id }));
    const onPlayPauseMock = jest.fn().mockImplementation((id, status) => ({ id, status }));

    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: { file: { name: 'audio.mp3' }, paused: false } as unknown as FileUpload,
        onPlayPause: onPlayPauseMock,
        onProgress: onProgressMock,
      }),
    );

    const soundPlayer = screen.getByTestId('sound-player');

    act(() => {
      fireEvent(soundPlayer, 'onEnd');
    });

    expect(onPlayPauseMock).toHaveBeenCalled();
    expect(onProgressMock).toHaveBeenCalled();
  });

  it('handle onProgress event of sound player', () => {
    const onProgressMock = jest.fn().mockImplementation((id, duration) => ({ duration, id }));

    render(
      getComponent({
        fileUploads: [generateFileUploadPreview({ type: 'audio/mp3' })],
        item: { file: { name: 'audio.mp3' }, paused: false } as unknown as FileUpload,
        onProgress: onProgressMock,
      }),
    );

    const soundPlayer = screen.getByTestId('sound-player');

    act(() => {
      fireEvent(soundPlayer, 'onProgress', {
        currentTime: 10,
        seekableDuration: 10,
      });
    });

    expect(onProgressMock).toHaveBeenCalled();
  });

  it('handle onProgressDrag event of the progress control', () => {
    const onProgressMock = jest.fn().mockImplementation((id, duration) => ({ duration, id }));
    const seekMock = jest.fn();

    jest.spyOn(React, 'useRef').mockReturnValue({
      current: {
        seek: seekMock,
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
    expect(seekMock).toHaveBeenCalled();
  });
});
