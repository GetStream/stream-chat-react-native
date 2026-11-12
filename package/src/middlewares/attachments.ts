import {
  AttachmentPreUploadMiddleware,
  isLocalVideoAttachment,
  MessageComposer,
} from 'stream-chat';

/**
 * Sets a local video's `localMetadata.previewUri` to its `thumb_url`, because the picked video
 * file itself cannot be rendered as a preview (other attachments preview the file URI). Also sends
 * the picked file's duration along as `custom.duration`, since the local file is gone once the
 * message is sent (e.g. when editing it).
 */
const createVideoAttachmentPreviewMiddleware = (): AttachmentPreUploadMiddleware => ({
  id: 'stream-io/message-composer-ui-middleware/video-attachment-preview',
  handlers: {
    prepare: ({ next, forward, state }) => {
      const { attachment } = state;

      if (!attachment || !isLocalVideoAttachment(attachment)) {
        return forward();
      }

      // Only the RN `FileReference` carries a `duration` (and a required `uri` to discriminate on).
      const { file } = attachment.localMetadata;
      const duration = file && 'uri' in file ? file.duration : undefined;
      const custom = duration ? { ...attachment.custom, duration } : attachment.custom;

      return next({
        ...state,
        attachment: {
          ...attachment,
          custom,
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
