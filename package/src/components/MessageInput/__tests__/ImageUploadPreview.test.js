import React from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateImageAttachment } from '../../../mock-builders/attachments';
import { FileState } from '../../../utils/utils';

import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { ImageUploadPreview } from '../ImageUploadPreview';

const renderComponent = ({ client, channel, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel channel={channel}>
          <ImageUploadPreview {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('ImageUploadPreview', () => {
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
      channel.messageComposer.clear();
    });
  });

  it('should render ImageUploadPreview with all uploading images', async () => {
    const attachments = [
      generateImageAttachment({
        localMetadata: {
          id: 'image-attachment',
          uploadState: FileState.UPLOADING,
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
      expect(queryAllByTestId('image-attachment-upload-preview')).toHaveLength(1);
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(1);
    });

    await act(() => {
      userEvent.press(getAllByTestId('remove-upload-preview')[0]);
    });

    await waitFor(() => {
      expect(channel.messageComposer.attachmentManager.attachments).toHaveLength(0);
    });
  });

  it('should return null when no images are uploaded', async () => {
    const props = {};

    renderComponent({ channel, client, props });

    const { queryAllByTestId } = screen;

    await waitFor(() => {
      expect(queryAllByTestId('file-upload-preview')).toHaveLength(0);
    });
  });

  it('should render ImageUploadPreview with all uploaded images', async () => {
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
      const imageAttachments = queryAllByTestId('image-attachment-upload-preview-image');
      for (const image of imageAttachments) {
        fireEvent(image, 'loadEnd');
      }
    });

    await waitFor(() => {
      expect(queryAllByTestId('image-attachment-upload-preview')).toHaveLength(1);
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(1);
    });
  });

  it('should render ImageUploadPreview with all failed images', async () => {
    const uploadAttachmentSpy = jest.fn();
    channel.messageComposer.attachmentManager.uploadAttachment = uploadAttachmentSpy;
    const attachments = [
      generateImageAttachment({
        localMetadata: {
          id: 'image-attachment',
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
      const imageAttachments = queryAllByTestId('image-attachment-upload-preview-image');
      for (const image of imageAttachments) {
        fireEvent(image, 'loadEnd');
      }
    });

    await waitFor(() => {
      expect(queryAllByTestId('image-attachment-upload-preview')).toHaveLength(1);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(1);
    });

    await act(() => {
      fireEvent.press(getAllByTestId('retry-upload-progress-indicator')[0]);
    });

    await waitFor(() => {
      expect(queryAllByTestId('image-attachment-upload-preview')).toHaveLength(1);
      expect(channel.messageComposer.attachmentManager.attachments).toHaveLength(1);
      expect(uploadAttachmentSpy).toHaveBeenCalled();
    });
  });

  it('should render ImageUploadPreview with all unsupported', async () => {
    const attachments = [
      generateImageAttachment({
        localMetadata: {
          id: 'image-attachment',
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
      const imageAttachments = queryAllByTestId('image-attachment-upload-preview-image');
      for (const image of imageAttachments) {
        fireEvent(image, 'loadEnd');
      }
    });

    await waitFor(() => {
      expect(queryAllByTestId('image-attachment-upload-preview')).toHaveLength(1);
      expect(queryAllByText('Not supported')).toHaveLength(1);
    });
  });

  it('should render ImageUploadPreview with 1 uploading, 1 uploaded, and 1 failed image, and 1 unsupported', async () => {
    const attachments = [
      generateImageAttachment({
        localMetadata: {
          id: 'image-attachment-1',
          uploadState: FileState.UPLOADING,
        },
      }),
      generateImageAttachment({
        localMetadata: {
          id: 'image-attachment-2',
          uploadState: FileState.FINISHED,
        },
      }),
      generateImageAttachment({
        localMetadata: {
          id: 'image-attachment-3',
          uploadState: FileState.FAILED,
        },
      }),
      generateImageAttachment({
        localMetadata: {
          id: 'image-attachment-4',
          uploadState: FileState.BLOCKED,
        },
      }),
    ];

    const props = {};
    await act(() => {
      channel.messageComposer.attachmentManager.upsertAttachments(attachments ?? []);
    });

    renderComponent({ channel, client, props });

    const { queryAllByTestId, queryAllByText } = screen;

    await waitFor(() => {
      const imageAttachments = queryAllByTestId('image-attachment-upload-preview-image');
      for (const image of imageAttachments) {
        fireEvent(image, 'loadEnd');
      }
    });

    await waitFor(() => {
      expect(queryAllByTestId('image-attachment-upload-preview')).toHaveLength(4);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByText('Not supported')).toHaveLength(1);
    });
  });
});
