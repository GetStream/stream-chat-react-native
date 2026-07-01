import type { Notification } from 'stream-chat';

import type { NotificationListFilter } from './NotificationList';

const ATTACHMENT_UPLOAD_FAILED_TYPE = 'api:attachment:upload:failed';

/**
 * A cancelled upload surfaces as an `api:attachment:upload:failed` notification
 * whose original error is an `AbortError` (fetch) or `CanceledError` (axios).
 * This is what happens when the user removes an attachment before its upload
 * has finished - the inflight request is aborted, not genuinely failed.
 */
const isCanceledAttachmentUpload = (notification: Notification) =>
  notification.type === ATTACHMENT_UPLOAD_FAILED_TYPE &&
  (notification.originalError?.name === 'CanceledError' ||
    notification.originalError?.name === 'AbortError');

/**
 * Notification list filter that keeps every notification except the spurious
 * "upload failed" one produced when a user removes an attachment mid-upload
 * (a filter returns `true` to keep a notification). Genuine upload failures
 * (network, server) are kept because their error is neither aborted nor
 * cancelled.
 */
export const excludeCanceledUploadNotifications: NotificationListFilter = (notification) =>
  !isCanceledAttachmentUpload(notification);
