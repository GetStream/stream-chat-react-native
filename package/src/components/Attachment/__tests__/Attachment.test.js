import React from 'react';
import { StyleSheet, View } from 'react-native';

import { render, waitFor } from '@testing-library/react-native';
import { v4 as uuidv4 } from 'uuid';

import { AudioPlayerProvider } from '../../../contexts/audioPlayerContext/AudioPlayerContext';
import { MessageProvider } from '../../../contexts/messageContext/MessageContext';
import { MessagesProvider } from '../../../contexts/messagesContext/MessagesContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';

import { ImageLoadingFailedIndicator } from '../../Attachment/ImageLoadingFailedIndicator';
import { ImageLoadingIndicator } from '../../Attachment/ImageLoadingIndicator';
import { Attachment } from '../Attachment';
import { FilePreview as FilePreviewDefault } from '../FilePreview';

jest.mock('../../../native.ts', () => {
  const { View } = require('react-native');

  return {
    NativeHandlers: {
      SDK: 'stream-chat-react-native',
      Sound: {
        initializeSound: jest.fn(() => null),
        Player: View,
      },
    },
    isVideoPlayerAvailable: jest.fn(() => false),
    isSoundPackageAvailable: jest.fn(() => false),
  };
});

jest.mock('../../../hooks/usePendingAttachmentUpload', () => ({
  usePendingAttachmentUpload: jest.fn(() => ({
    isUploading: false,
    uploadProgress: undefined,
  })),
}));

const getAttachmentComponent = (props) => {
  const message = generateMessage();
  return (
    <ThemeProvider>
      <AudioPlayerProvider value={{ allowConcurrentAudioPlayback: false }}>
        <MessagesProvider
          value={{
            FilePreview: FilePreviewDefault,
            ImageLoadingFailedIndicator,
            ImageLoadingIndicator,
          }}
        >
          <MessageProvider value={{ message }}>
            <Attachment {...props} />
          </MessageProvider>
        </MessagesProvider>
      </AudioPlayerProvider>
    </ThemeProvider>
  );
};

const getWaveformBarCount = (root) =>
  root.findAllByType(View).filter((node) => {
    const flattenedStyle = StyleSheet.flatten(node.props.style);
    return flattenedStyle?.width === 2 && typeof flattenedStyle?.height === 'number';
  }).length;

describe('Attachment', () => {
  it('should render File component for "audio" type attachment', async () => {
    const attachment = generateAudioAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('should render File component for "video" type attachment', async () => {
    const attachment = generateVideoAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('should render File component for "file" type attachment', async () => {
    const attachment = generateFileAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('file-attachment')).toBeTruthy();
    });
  });

  it('should render waveform for playable audio attachments without an active upload', async () => {
    const { isSoundPackageAvailable } = require('../../../native');
    isSoundPackageAvailable.mockReturnValue(true);
    const attachment = generateAudioAttachment({
      duration: 10,
      waveform_data: [0.2, 0.6, 0.4],
    });
    const { getByLabelText, root } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByLabelText('audio-attachment-preview')).toBeTruthy();
      expect(getWaveformBarCount(root)).toBeGreaterThan(0);
    });
    isSoundPackageAvailable.mockReturnValue(false);
  });

  it('should render UrlPreview component if attachment has title_link or og_scrape_url', async () => {
    const attachment = generateImageAttachment({
      og_scrape_url: uuidv4(),
      title_link: uuidv4(),
    });
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('card-attachment')).toBeTruthy();
    });
  });

  it('should render Gallery component if image does not have title_link or og_scrape_url', async () => {
    const attachment = generateImageAttachment();
    const { getByTestId } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByTestId('gallery-container')).toBeTruthy();
    });
  });
});
