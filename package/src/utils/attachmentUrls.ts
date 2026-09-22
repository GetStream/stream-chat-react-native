import { Attachment, FileReference, isLocalUploadAttachment, LocalAttachment } from 'stream-chat';

const localFileUri = (attachment: Attachment | LocalAttachment) =>
  isLocalUploadAttachment(attachment)
    ? (attachment.localMetadata.file as FileReference | undefined)?.uri
    : undefined;

/**
 * The attachment's own URL — `asset_url` / `image_url`, or the local file it has yet to be uploaded
 * from. This is what to play, open or upload.
 *
 * Deliberately skips `localMetadata.previewUri`: for a video, `setupVideoAttachmentPreviewMiddleware`
 * replaces it with the thumbnail the picker extracted (`thumb_url`). For every other type the LLC's
 * `toLocalUploadAttachment` sets it to the picked file's own `uri`, so this and `stream-chat`'s
 * `getAttachmentPreviewUrl` agree for images, files and audio.
 */
export const getAttachmentUrl = (attachment: Attachment | LocalAttachment) =>
  attachment.asset_url ?? attachment.image_url ?? localFileUri(attachment);
