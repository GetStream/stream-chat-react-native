import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import {
  generateAudioAttachment,
  generateFileAttachment,
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/attachments';

import { FileState } from '../../../utils/utils';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { FileUploadPreview } from '../FileUploadPreview';

jest.mock('../../../native.ts', () => {
  const View = require('react-native/Libraries/Components/View/View');

  return {
    isAudioRecorderAvailable: jest.fn(() => true),
    isDocumentPickerAvailable: jest.fn(() => true),
    isImageMediaLibraryAvailable: jest.fn(() => true),
    isImagePickerAvailable: jest.fn(() => true),
    isSoundPackageAvailable: jest.fn(() => false),
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
          <FileUploadPreview {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe("FileUploadPreview's render", () => {
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

  it('should return null when no files are uploaded', async () => {
    const props = {};

    renderComponent({ channel, client, props });

    const { queryAllByTestId } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('file-upload-preview')).toHaveLength(0);
    });
  });

  it('should return null when the file is an image', async () => {
    const attachments = [
      generateImageAttachment({
        localMetadata: {
          id: 'image-attachment',
          uploadState: FileState.FINISHED,
        },
      }),
    ];
    const props = {};

    await act(() => {
      channel.messageComposer.attachmentManager.upsertAttachments(attachments ?? []);
    });

    renderComponent({ channel, client, props });

    const { queryAllByTestId } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('file-attachment-upload-preview')).toHaveLength(0);
    });
  });

  it('should render FileAttachmentUploadPreview when the sound package is unavailable', async () => {
    const attachments = [
      generateAudioAttachment({
        localMetadata: {
          id: 'audio-attachment',
          uploadState: FileState.UPLOADING,
        },
      }),
    ];

    const props = {};

    await act(() => {
      channel.messageComposer.attachmentManager.upsertAttachments(attachments);
    });

    renderComponent({ channel, client, props });

    const { queryAllByTestId } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('file-attachment-upload-preview')).toHaveLength(1);
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(1);
    });
  });

  describe('FileAttachmentUploadPreview', () => {
    it('should render FileAttachmentUploadPreview with all uploading files', async () => {
      const attachments = [
        generateFileAttachment({
          localMetadata: {
            id: 'file-attachment',
            uploadState: FileState.UPLOADING,
          },
        }),
        generateVideoAttachment({
          localMetadata: {
            id: 'video-attachment',
            uploadState: FileState.UPLOADING,
          },
        }),
      ];
      const props = {};

      await act(() => {
        channel.messageComposer.attachmentManager.upsertAttachments(attachments);
      });

      renderComponent({ channel, client, props });

      const { getAllByTestId, queryAllByTestId } = screen;

      await waitFor(() => {
        expect(queryAllByTestId('file-attachment-upload-preview')).toHaveLength(2);
        expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(2);
        expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(2);
      });

      await act(() => {
        fireEvent.press(getAllByTestId('remove-upload-preview')[0]);
      });

      await waitFor(() => {
        expect(channel.messageComposer.attachmentManager.attachments).toHaveLength(1);
      });

      await act(() => {
        fireEvent.press(getAllByTestId('remove-upload-preview')[0]);
      });

      await waitFor(() => {
        expect(channel.messageComposer.attachmentManager.attachments).toHaveLength(0);
      });
    });

    it('should render FileAttachmentUploadPreview with all uploaded files', async () => {
      const attachments = [
        generateFileAttachment({
          localMetadata: {
            id: 'image-attachment',
            uploadState: FileState.FINISHED,
          },
        }),
        generateVideoAttachment({
          localMetadata: {
            id: 'video-attachment',
            uploadState: FileState.FINISHED,
          },
        }),
      ];
      const props = {};

      await act(() => {
        channel.messageComposer.attachmentManager.upsertAttachments(attachments ?? []);
      });

      renderComponent({ channel, client, props });

      const { queryAllByTestId } = screen;

      await waitFor(() => {
        expect(queryAllByTestId('file-attachment-upload-preview')).toHaveLength(2);
        expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(2);
      });
    });

    it('should render FileAttachmentUploadPreview with all failed files', async () => {
      const uploadAttachmentSpy = jest.fn();
      channel.messageComposer.attachmentManager.uploadAttachment = uploadAttachmentSpy;
      const attachments = [
        generateFileAttachment({
          localMetadata: {
            id: 'file-attachment',
            uploadState: FileState.FAILED,
          },
        }),
        generateVideoAttachment({
          localMetadata: {
            id: 'video-attachment',
            uploadState: FileState.FAILED,
          },
        }),
      ];
      const props = {};

      await act(() => {
        channel.messageComposer.attachmentManager.upsertAttachments(attachments ?? []);
      });

      renderComponent({ channel, client, props });

      const { getAllByTestId, queryAllByTestId } = screen;

      await waitFor(() => {
        expect(queryAllByTestId('file-attachment-upload-preview')).toHaveLength(2);
        expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(2);
      });

      await act(() => {
        fireEvent.press(getAllByTestId('retry-upload-progress-indicator')[0]);
      });

      await waitFor(() => {
        expect(queryAllByTestId('file-attachment-upload-preview')).toHaveLength(2);
        expect(channel.messageComposer.attachmentManager.attachments).toHaveLength(2);
        expect(uploadAttachmentSpy).toHaveBeenCalled();
      });
    });

    it('should render FileAttachmentUploadPreview with all unsupported', async () => {
      const attachments = [
        generateFileAttachment({
          localMetadata: {
            id: 'file-attachment',
            uploadState: FileState.BLOCKED,
          },
        }),
        generateVideoAttachment({
          localMetadata: {
            id: 'video-attachment',
            uploadState: FileState.BLOCKED,
          },
        }),
      ];
      const props = {};

      await act(() => {
        channel.messageComposer.attachmentManager.upsertAttachments(attachments ?? []);
      });

      renderComponent({ channel, client, props });

      const { queryAllByText, queryAllByTestId } = screen;

      await waitFor(() => {
        expect(queryAllByTestId('file-attachment-upload-preview')).toHaveLength(2);
        expect(queryAllByText('Not supported')).toHaveLength(2);
      });
    });
  });
});
