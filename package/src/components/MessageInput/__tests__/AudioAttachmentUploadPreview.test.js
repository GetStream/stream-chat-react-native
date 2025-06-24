import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateAudioAttachment } from '../../../mock-builders/attachments';

import { FileState } from '../../../utils/utils';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { AttachmentUploadPreviewList } from '../AttachmentUploadPreviewList';

jest.mock('../../../native.ts', () => {
  const View = require('react-native').View;

  return {
    isAudioRecorderAvailable: jest.fn(() => true),
    isDocumentPickerAvailable: jest.fn(() => true),
    isImageMediaLibraryAvailable: jest.fn(() => true),
    isImagePickerAvailable: jest.fn(() => true),
    isSoundPackageAvailable: jest.fn(() => true),
    NativeHandlers: {
      Sound: {
        Player: View,
      },
    },
  };
});

const renderComponent = ({ client, channel, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel channel={channel}>
          <AttachmentUploadPreviewList {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('AudioAttachmentUploadPreview render', () => {
  let client;
  let channel;

  beforeEach(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
    act(() => {
      channel.messageComposer.attachmentManager.initState();
    });
  });

  it('should render AudioAttachmentUploadPreview with all uploading files', async () => {
    const attachments = [
      generateAudioAttachment({
        localMetadata: {
          file: {
            uri: 'file://audio-attachment.mp3',
          },
          id: 'audio-attachment',
          uploadState: FileState.UPLOADING,
        },
      }),
    ];
    const props = {};

    act(() => {
      channel.messageComposer.attachmentManager.upsertAttachments(attachments);
    });

    renderComponent({ channel, client, props });

    const { getByLabelText, getAllByTestId, queryAllByTestId } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('audio-attachment-upload-preview')).toHaveLength(1);
      expect(getByLabelText('audio-attachment-preview')).toBeDefined();
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(1);
    });

    act(() => {
      fireEvent.press(getAllByTestId('remove-upload-preview')[0]);
    });

    await waitFor(() => {
      expect(channel.messageComposer.attachmentManager.attachments).toHaveLength(0);
    });
  });

  it('should render AudioAttachmentUploadPreview with all uploaded files', async () => {
    const attachments = [
      generateAudioAttachment({
        localMetadata: {
          file: {
            uri: 'file://audio-attachment.mp3',
          },
          id: 'audio-attachment',
          uploadState: FileState.FINISHED,
        },
      }),
    ];
    const props = {};

    act(() => {
      channel.messageComposer.attachmentManager.upsertAttachments(attachments);
    });

    renderComponent({ channel, client, props });

    const { getByLabelText, queryAllByTestId } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('audio-attachment-upload-preview')).toHaveLength(1);
      expect(getByLabelText('audio-attachment-preview')).toBeDefined();
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(1);
    });
  });

  it('should render AudioAttachmentUploadPreview with all failed files', async () => {
    const uploadAttachmentSpy = jest.fn();
    channel.messageComposer.attachmentManager.uploadAttachment = uploadAttachmentSpy;
    const attachments = [
      generateAudioAttachment({
        localMetadata: {
          file: {
            uri: 'file://audio-attachment.mp3',
          },
          id: 'audio-attachment',
          uploadState: FileState.FAILED,
        },
      }),
    ];
    const props = {};

    act(() => {
      channel.messageComposer.attachmentManager.upsertAttachments(attachments);
    });

    renderComponent({ channel, client, props });

    const { getAllByTestId, getByLabelText, queryAllByTestId } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('audio-attachment-upload-preview')).toHaveLength(1);
      expect(getByLabelText('audio-attachment-preview')).toBeDefined();
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(1);
    });

    act(() => {
      fireEvent.press(getAllByTestId('retry-upload-progress-indicator')[0]);
    });

    await waitFor(() => {
      expect(queryAllByTestId('audio-attachment-upload-preview')).toHaveLength(1);
      expect(getByLabelText('audio-attachment-preview')).toBeDefined();
      expect(channel.messageComposer.attachmentManager.attachments).toHaveLength(1);
      expect(uploadAttachmentSpy).toHaveBeenCalled();
    });
  });

  it('should render AudioAttachmentUploadPreview with all unsupported', async () => {
    const attachments = [
      generateAudioAttachment({
        localMetadata: {
          file: {
            uri: 'file://audio-attachment.mp3',
          },
          id: 'audio-attachment',
          uploadState: FileState.BLOCKED,
        },
      }),
    ];
    const props = {};

    act(() => {
      channel.messageComposer.attachmentManager.upsertAttachments(attachments);
    });

    renderComponent({ channel, client, props });

    const { getByLabelText, queryAllByTestId, queryAllByText } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('audio-attachment-upload-preview')).toHaveLength(1);
      expect(getByLabelText('audio-attachment-preview')).toBeDefined();
      expect(queryAllByText('Not supported')).toHaveLength(1);
    });
  });
});
