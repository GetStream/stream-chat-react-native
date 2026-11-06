import { Attachment, FileReference, isLocalUploadAttachment, LocalAttachment } from 'stream-chat';

const localFileUri = (attachment: Attachment | LocalAttachment) =>
  isLocalUploadAttachment(attachment)
    ? (attachment.localMetadata.file as FileReference | undefined)?.uri
    : undefined;

/**
 * The URL to play a video from: `asset_url`, `image_url`, or the local file it is yet to be
 * uploaded from.
 *
 * Videos only; use `getAttachmentPreviewUrl` for other types. The
 * `setupVideoAttachmentPreviewMiddleware` sets `localMetadata.previewUri` to the video's
 * `thumb_url`, so `getAttachmentPreviewUrl` would return the thumbnail, not the video.
 */
export const getPlayableVideoUrl = (attachment: Attachment | LocalAttachment) =>
  attachment.asset_url ?? attachment.image_url ?? localFileUri(attachment);
