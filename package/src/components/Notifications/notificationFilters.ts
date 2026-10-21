import type { Notification } from 'stream-chat';

import type { NotificationListFilter } from './NotificationList';

const ATTACHMENT_UPLOAD_FAILED_TYPE = 'api:attachment:upload:failed';

// Removing an attachment before its upload finishes aborts the request. That surfaces as an
// `api:attachment:upload:failed` notification whose original error is an `AbortError` (fetch) or
// `CanceledError` (axios).
const isCanceledAttachmentUpload = (notification: Notification) =>
  notification.type === ATTACHMENT_UPLOAD_FAILED_TYPE &&
  (notification.originalError?.name === 'CanceledError' ||
    notification.originalError?.name === 'AbortError');

/**
 * Notification list filter that hides the "upload failed" notification produced when a user removes
 * an attachment mid-upload. Genuine upload failures (network, server) stay, as their error is
 * neither an abort nor a cancellation.
 *
 * @param notification The notification to test.
 * @returns `false` for a canceled upload, `true` otherwise.
 */
export const excludeCanceledUploadNotifications: NotificationListFilter = (notification) =>
  !isCanceledAttachmentUpload(notification);
