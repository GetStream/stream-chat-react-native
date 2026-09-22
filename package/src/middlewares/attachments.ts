import {
  AttachmentPreUploadMiddleware,
  isLocalVideoAttachment,
  MessageComposer,
} from 'stream-chat';

/**
 * Supplies a local video's preview URI.
 *
 * Every other attachment type gets `localMetadata.previewUri` from `toLocalUploadAttachment`,
 * which points it at the picked file itself. A video file is not renderable, so the preview has
 * to be the thumbnail the native picker extracted (`thumb_url`) instead.
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
