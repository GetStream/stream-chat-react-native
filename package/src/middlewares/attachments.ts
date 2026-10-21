import {
  AttachmentPreUploadMiddleware,
  isLocalVideoAttachment,
  MessageComposer,
} from 'stream-chat';

/**
 * Sets a local video's `localMetadata.previewUri` to its `thumb_url`, because the picked video
 * file itself cannot be rendered as a preview (other attachments preview the file URI).
 */
const createVideoAttachmentPreviewMiddleware = (): AttachmentPreUploadMiddleware => ({
  id: 'stream-io/message-composer-ui-middleware/video-attachment-preview',
  handlers: {
    prepare: ({ next, forward, state }) => {
      const { attachment } = state;

      if (!attachment || !isLocalVideoAttachment(attachment)) {
        return forward();
      }

      return next({
        ...state,
        attachment: {
          ...attachment,
          localMetadata: {
            ...attachment.localMetadata,
            previewUri: attachment.thumb_url,
          },
        },
      });
    },
  },
});

export const setupVideoAttachmentPreviewMiddleware = (messageComposer: MessageComposer) => {
  messageComposer.attachmentManager.preUploadMiddlewareExecutor.insert({
    middleware: [createVideoAttachmentPreviewMiddleware()],
    position: { after: 'stream-io/attachment-manager-middleware/file-upload-config-check' },
    unique: true,
  });
};
