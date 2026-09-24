import { Attachment, FileReference, isLocalUploadAttachment, LocalAttachment } from 'stream-chat';

const localFileUri = (attachment: Attachment | LocalAttachment) =>
  isLocalUploadAttachment(attachment)
    ? (attachment.localMetadata.file as FileReference | undefined)?.uri
    : undefined;

/**
 * The URL to play a video from — `asset_url` / `image_url`, or the local file it has yet to be
 * uploaded from.
 *
 * Only videos need this. For them `setupVideoAttachmentPreviewMiddleware` replaces
 * `localMetadata.previewUri` with the thumbnail the picker extracted, so `stream-chat`'s
 * `getAttachmentPreviewUrl` would play the thumbnail. For every other type the LLC's
 * `toLocalUploadAttachment` sets `previewUri` to the picked file's own `uri`, so use
 * `getAttachmentPreviewUrl` there.
 */
export const getPlayableVideoUrl = (attachment: Attachment | LocalAttachment) =>
  attachment.asset_url ?? attachment.image_url ?? localFileUri(attachment);
