import React, { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ReactTestInstance } from 'react-test-renderer';

import { render, screen, waitFor } from '@testing-library/react-native';
import type { Attachment as AttachmentType } from 'stream-chat';
import { v4 as uuidv4 } from 'uuid';

import { AudioPlayerProvider } from '../../../contexts/audioPlayerContext/AudioPlayerContext';
import type { MessageContextValue } from '../../../contexts/messageContext/MessageContext';
import { MessageProvider } from '../../../contexts/messageContext/MessageContext';
import type { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import { MessagesProvider } from '../../../contexts/messagesContext/MessagesContext';
import { mergeThemes, ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { usePendingAttachmentUpload } from '../../../hooks/usePendingAttachmentUpload';
import { generateFileReference } from '../../../mock-builders/attachments';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { FileTypes } from '../../../types/types';

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

const mockedUsePendingAttachmentUpload = jest.mocked(usePendingAttachmentUpload);

const idle = { isUploading: false, uploadProgress: undefined };

const getAttachmentComponent = (
  props: ComponentProps<typeof Attachment>,
  messageContextValue: Partial<MessageContextValue> = {},
) => {
  const message = messageContextValue.message ?? generateMessage();
  return (
    <ThemeProvider>
      <AudioPlayerProvider value={{ allowConcurrentAudioPlayback: false }}>
        <MessagesProvider
          value={
            {
              FilePreview: FilePreviewDefault,
              ImageLoadingFailedIndicator,
              ImageLoadingIndicator,
              message,
            } as unknown as MessagesContextValue
          }
        >
          <MessageProvider
            value={{ message, ...messageContextValue } as unknown as MessageContextValue}
          >
            <Attachment {...props} />
          </MessageProvider>
        </MessagesProvider>
      </AudioPlayerProvider>
    </ThemeProvider>
  );
};

const getWaveformBarCount = (root: ReactTestInstance) =>
  root.findAllByType(View).filter((node: ReactTestInstance) => {
    const flattenedStyle = StyleSheet.flatten(node.props.style);
    return flattenedStyle?.width === 2 && typeof flattenedStyle?.height === 'number';
  }).length;

describe('Attachment', () => {
  const lightTheme = mergeThemes({ scheme: 'light' });

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
      custom: { duration: 10, waveform_data: [0.2, 0.6, 0.4] },
    } as Partial<AttachmentType>);
    const { getByLabelText, root } = render(getAttachmentComponent({ attachment }));

    await waitFor(() => {
      expect(getByLabelText('audio-attachment-preview')).toBeTruthy();
      expect(getWaveformBarCount(root)).toBeGreaterThan(0);
    });
    isSoundPackageAvailable.mockReturnValue(false);
  });

  it('uses a transparent audio player background for quoted replies without captions', async () => {
    const { isSoundPackageAvailable } = require('../../../native');
    isSoundPackageAvailable.mockReturnValue(true);
    const attachment = generateAudioAttachment({
      custom: { duration: 10, waveform_data: [0.2, 0.6, 0.4] },
    } as Partial<AttachmentType>);
    const quotedMessage = generateMessage();
    const message = generateMessage({
      attachments: [attachment],
      quoted_message: quotedMessage,
      quoted_message_id: quotedMessage.id,
      text: '',
    });

    const { getByLabelText } = render(
      getAttachmentComponent(
        { attachment },
        { isMyMessage: false, message, messageHasOnlySingleAttachment: false },
      ),
    );

    await waitFor(() => {
      const style = StyleSheet.flatten(getByLabelText('audio-attachment-preview').props.style);
      expect(style.backgroundColor).toBe('transparent');
    });
    isSoundPackageAvailable.mockReturnValue(false);
  });

  it('keeps the audio player background for quoted replies with captions', async () => {
    const { isSoundPackageAvailable } = require('../../../native');
    isSoundPackageAvailable.mockReturnValue(true);
    const attachment = generateAudioAttachment({
      custom: { duration: 10, waveform_data: [0.2, 0.6, 0.4] },
      type: FileTypes.VoiceRecording,
    } as Partial<AttachmentType>);
    const quotedMessage = generateMessage();
    const message = generateMessage({
      attachments: [attachment],
      quoted_message: quotedMessage,
      quoted_message_id: quotedMessage.id,
      text: 'caption',
    });

    const { getByLabelText } = render(
      getAttachmentComponent(
        { attachment },
        { isMyMessage: false, message, messageHasOnlySingleAttachment: false },
      ),
    );

    await waitFor(() => {
      const style = StyleSheet.flatten(getByLabelText('audio-attachment-preview').props.style);
      expect(style.backgroundColor).toBe(lightTheme.semantics.chatBgAttachmentIncoming);
    });
    isSoundPackageAvailable.mockReturnValue(false);
  });

  it('keeps the audio player background for quoted replies with multiple attachments and no captions', async () => {
    const { isSoundPackageAvailable } = require('../../../native');
    isSoundPackageAvailable.mockReturnValue(true);
    const attachment = generateAudioAttachment({
      custom: { duration: 10, waveform_data: [0.2, 0.6, 0.4] },
    } as Partial<AttachmentType>);
    const quotedMessage = generateMessage();
    const message = generateMessage({
      attachments: [attachment, generateAudioAttachment()],
      quoted_message: quotedMessage,
      quoted_message_id: quotedMessage.id,
      text: '',
    });

    const { getByLabelText } = render(
      getAttachmentComponent(
        { attachment },
        { isMyMessage: false, message, messageHasOnlySingleAttachment: false },
      ),
    );

    await waitFor(() => {
      const style = StyleSheet.flatten(getByLabelText('audio-attachment-preview').props.style);
      expect(style.backgroundColor).toBe(lightTheme.semantics.chatBgAttachmentIncoming);
    });
    isSoundPackageAvailable.mockReturnValue(false);
  });

  it('uses the outgoing audio player background on our own message', async () => {
    const { isSoundPackageAvailable } = require('../../../native');
    isSoundPackageAvailable.mockReturnValue(true);
    const attachment = generateAudioAttachment({ duration: 10, waveform_data: [0.2, 0.6] });
    const message = generateMessage({ attachments: [attachment, generateAudioAttachment()] });

    const { getByLabelText } = render(
      getAttachmentComponent(
        { attachment },
        { isMyMessage: true, message, messageHasOnlySingleAttachment: false },
      ),
    );

    await waitFor(() => {
      const style = StyleSheet.flatten(getByLabelText('audio-attachment-preview').props.style);
      expect(style.backgroundColor).toBe(lightTheme.semantics.chatBgAttachmentOutgoing);
    });
    isSoundPackageAvailable.mockReturnValue(false);
  });

  it('resolves the audio duration label colour from the message side', async () => {
    const { isSoundPackageAvailable } = require('../../../native');
    isSoundPackageAvailable.mockReturnValue(true);
    const attachment = generateAudioAttachment({ duration: 10, waveform_data: [0.2, 0.6] });
    const message = generateMessage({ attachments: [attachment] });

    const { getByLabelText } = render(
      getAttachmentComponent(
        { attachment },
        { isMyMessage: true, message, messageHasOnlySingleAttachment: false },
      ),
    );

    // NOTE: `StableDurationLabel` applies its own `visibleStyle` last, which
    // always sets `color` from the playback state - so this asserts the wiring
    // reaching the label, not the final rendered pixel. See the reserve label.
    await waitFor(() => {
      expect(getByLabelText('Progress Duration').props.style).toEqual(
        expect.arrayContaining([
          expect.arrayContaining([
            expect.objectContaining({ color: lightTheme.semantics.chatTextOutgoing }),
          ]),
        ]),
      );
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

  // A message can be sent while its attachments are still uploading
  // (`messageComposer.attachments.pendingUploadsEnabled`). Such an attachment has no URL of its own — everything
  // needed to render it and to follow its upload lives in `localMetadata`.
  describe('attachment whose upload has not resolved', () => {
    // No `asset_url`: the upload has not resolved, so the file handle in `localMetadata` is the
    // only source there is. `uploadState` is what makes it a local upload attachment at all.
    const pendingFileAttachment = () =>
      ({
        custom: { file_size: 2000000, mime_type: 'application/pdf' },
        localMetadata: {
          file: generateFileReference({ name: 'report.pdf', uri: 'file://local/report.pdf' }),
          id: 'upload-1',
          previewUri: 'file://local/report.pdf',
          uploadState: 'uploading',
        },
        title: 'report.pdf',
        type: 'file',
      }) as unknown as AttachmentType;

    afterEach(() => {
      mockedUsePendingAttachmentUpload.mockReturnValue(idle);
    });

    it('follows the upload by its localMetadata id', () => {
      mockedUsePendingAttachmentUpload.mockReturnValue(idle);

      render(getAttachmentComponent({ attachment: pendingFileAttachment() }));

      // Reading this from anywhere else (v9 used `custom.localId`) means no indicator can ever
      // render, because the upload manager is keyed by exactly this id.
      expect(mockedUsePendingAttachmentUpload).toHaveBeenCalledWith('upload-1');
    });

    it('shows upload progress in place of the file size while the upload is in flight', () => {
      mockedUsePendingAttachmentUpload.mockReturnValue({ isUploading: true, uploadProgress: 50 });

      render(getAttachmentComponent({ attachment: pendingFileAttachment() }));

      // The uploaded/total readout replaces the plain size label — only it contains a slash.
      expect(screen.getByText(/ \/ /)).toBeTruthy();
    });

    it('takes the progress total from the held file when file_size is not set yet', () => {
      mockedUsePendingAttachmentUpload.mockReturnValue({ isUploading: true, uploadProgress: 50 });
      const attachment = pendingFileAttachment() as unknown as {
        custom: Record<string, unknown>;
        localMetadata: { file: Record<string, unknown> };
      };
      delete attachment.custom.file_size;
      attachment.localMetadata.file.size = 2000000;

      render(getAttachmentComponent({ attachment: attachment as unknown as AttachmentType }));

      // Without a total the indicator shows no `uploaded / total` readout at all.
      expect(screen.getByText(/ \/ /)).toBeTruthy();
    });

    it('shows no progress readout once no upload is in flight', () => {
      // A message rehydrated from the offline DB keeps a frozen `uploadState`, so the payload alone
      // must not be enough to render progress — only a live upload record is.
      mockedUsePendingAttachmentUpload.mockReturnValue(idle);

      render(getAttachmentComponent({ attachment: pendingFileAttachment() }));

      expect(screen.queryByText(/ \/ /)).toBeNull();
    });
  });
});
