import React, { ComponentProps } from 'react';

import { ActivityIndicator } from 'react-native';

import type { ReactTestInstance } from 'react-test-renderer';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { Attachment, Channel as ChannelType, LocalAttachment, StreamChat } from 'stream-chat';

import { OverlayProvider } from '../../../contexts';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateAudioAttachment as generateAudioAttachmentBase } from '../../../mock-builders/attachments';

import { FileState } from '../../../utils/utils';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { AttachmentUploadPreviewList } from '../components/AttachmentPreview/AttachmentUploadPreviewList';

const generateAudioAttachment = (a?: unknown): LocalAttachment =>
  generateAudioAttachmentBase(a as Partial<Attachment>) as unknown as LocalAttachment;

jest.mock('../../../native.ts', () => {
  const View = require('react-native').View;

  return {
    isAudioRecorderAvailable: jest.fn(() => true),
    isDocumentPickerAvailable: jest.fn(() => true),
    isImageMediaLibraryAvailable: jest.fn(() => true),
    isImagePickerAvailable: jest.fn(() => true),
    isNativeMultipartUploadAvailable: jest.fn(() => false),
    isSoundPackageAvailable: jest.fn(() => true),
    NativeHandlers: {
      Sound: {
        Player: View,
      },
    },
  };
});

const renderComponent = ({
  client,
  channel,
  props,
}: {
  client: StreamChat;
  channel: ChannelType;
  props: Partial<ComponentProps<typeof AttachmentUploadPreviewList>>;
}) => {
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

type PendingUploadRecord = {
  id: string;
  uploadProgress?: number;
};

const setPendingUploads = (client: StreamChat, uploads: PendingUploadRecord[]) => {
  act(() => {
    client.uploadManager.state.partialNext({
      uploads: Object.fromEntries(
        uploads.map(({ id, uploadProgress }) => [id, { id, uploadProgress }]),
      ),
    });
  });
};

const countActivityIndicators = (nodes: ReactTestInstance[]) =>
  nodes.reduce(
    (count: number, node: ReactTestInstance) =>
      count + node.findAllByType(ActivityIndicator).length,
    0,
  );

describe('AudioAttachmentUploadPreview render', () => {
  let client: StreamChat;
  let channel: ChannelType;

  beforeEach(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
    act(() => {
      client?.uploadManager?.reset();
      channel.messageComposer.attachmentManager.initState();
    });
  });

  it('should render AudioAttachmentUploadPreview with all uploading files', async () => {
    const attachments = [
      generateAudioAttachment({
        asset_url: undefined,
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
    setPendingUploads(client, [{ id: 'audio-attachment' }]);

    renderComponent({ channel, client, props });

    const { getAllByTestId, queryAllByTestId } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('audio-attachment-upload-preview')).toHaveLength(1);
      expect(countActivityIndicators(getAllByTestId('audio-attachment-upload-preview'))).toBe(1);
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

    const { getByLabelText, queryAllByTestId } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('audio-attachment-upload-preview')).toHaveLength(1);
      expect(getByLabelText('audio-attachment-preview')).toBeDefined();
      expect(queryAllByTestId('inline-not-supported-indicator')).toHaveLength(1);
    });
  });
});
