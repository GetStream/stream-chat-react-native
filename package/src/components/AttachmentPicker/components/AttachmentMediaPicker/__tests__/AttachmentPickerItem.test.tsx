import React, { Profiler } from 'react';

import { act, cleanup, render } from '@testing-library/react-native';
import type { Channel, LocalImageAttachment, StreamChat } from 'stream-chat';

import { MessageComposerProvider } from '../../../../../contexts/messageComposerContext/MessageComposerContext';
import { initiateClientWithChannels } from '../../../../../mock-builders/api/initiateClientWithChannels';
import { Chat } from '../../../../Chat/Chat';
import { renderAttachmentPickerItem } from '../AttachmentPickerItem';

const uploadingImage = (uploadProgress: number) =>
  ({
    localMetadata: {
      file: { name: 'photo.jpg', type: 'image/jpeg', uri: 'file://photo.jpg' },
      id: 'photo',
      previewUri: 'file://photo.jpg',
      uploadProgress,
      uploadState: 'uploading',
    },
    type: 'image',
  }) as unknown as LocalImageAttachment;

describe('AttachmentPickerItem', () => {
  let channel: Channel;
  let chatClient: StreamChat;

  beforeEach(async () => {
    const { client, channels } = await initiateClientWithChannels();
    channel = channels[0];
    chatClient = client;
  });

  afterEach(cleanup);

  it('does not re-render while its selected image uploads', () => {
    const { attachmentManager } = channel.messageComposer;
    act(() => attachmentManager.upsertAttachments([uploadingImage(10)]));
    let renders = 0;

    render(
      <Chat client={chatClient}>
        <MessageComposerProvider value={{ channel, threadInstance: undefined }}>
          <Profiler id='cell' onRender={() => (renders += 1)}>
            {renderAttachmentPickerItem({
              item: { name: 'photo.jpg', size: 1024, type: 'image/jpeg', uri: 'file://photo.jpg' },
            })}
          </Profiler>
        </MessageComposerProvider>
      </Chat>,
    );
    const rendersBefore = renders;

    // What each upload progress tick publishes: a new attachments array, the cell's index unchanged.
    const progress = (uploadProgress: number) =>
      attachmentManager.state.partialNext({ attachments: [uploadingImage(uploadProgress)] });
    act(() => progress(50));
    act(() => progress(90));

    // Guard against a vacuous pass: the progress really was written.
    expect(attachmentManager.attachments[0].localMetadata.uploadProgress).toBe(90);
    expect(renders).toBe(rendersBefore);
  });
});
