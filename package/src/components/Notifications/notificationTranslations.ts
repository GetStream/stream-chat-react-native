import type { Notification } from 'stream-chat';

import { translateExternalString } from '../../i18n/externalStrings';
import type { StreamTFunction } from '../../i18n/types';
import { asDynamicKey } from '../../i18n/utils';

const normalizeReason = (notification?: Notification) => {
  const reason = notification?.metadata?.reason;
  if (typeof reason !== 'string' || !reason.length) return undefined;

  return reason.toLowerCase();
};

const withReasonFallback = ({
  fallbackTranslationKey,
  notification,
  reasonTranslationKey,
  t,
}: {
  fallbackTranslationKey: string;
  notification?: Notification;
  reasonTranslationKey: string;
  t: StreamTFunction;
}) => {
  const reason = normalizeReason(notification);
  if (!reason) return t(asDynamicKey(fallbackTranslationKey));

  return t(asDynamicKey(reasonTranslationKey), { reason });
};

const translateAttachmentUploadBlocked = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: StreamTFunction;
}) => {
  const rawReason = notification?.metadata?.reason;
  let reason = t(
    'notifications.attachmentUploadBlocked.reason.unsupportedFileType.text',
    'unsupported file type',
  );
  if (typeof rawReason !== 'string')
    reason = t('notifications.attachmentUploadBlocked.reason.unknownError.text', 'unknown error');
  if (rawReason === 'size_limit')
    reason = t('notifications.attachmentUploadBlocked.reason.sizeLimit.text', 'size limit');

  return t(
    'notifications.attachmentUploadBlocked.error',
    'Attachment upload blocked due to {{reason}}',
    { reason },
  );
};

const translateAttachmentUploadFailed = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: StreamTFunction;
}) =>
  withReasonFallback({
    fallbackTranslationKey: 'notifications.attachmentUploadFailed.error',
    notification,
    reasonTranslationKey: 'notifications.attachmentUploadFailed.withReason.error',
    t,
  });

const translatePollCreateFailed = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: StreamTFunction;
}) =>
  withReasonFallback({
    fallbackTranslationKey: 'notifications.pollCreateFailed.error',
    notification,
    reasonTranslationKey: 'notifications.pollCreateFailed.withReason.error',
    t,
  });

const translatePollEndFailed = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: StreamTFunction;
}) =>
  withReasonFallback({
    fallbackTranslationKey: 'poll.endVote.error',
    notification,
    reasonTranslationKey: 'notifications.pollEndFailed.withReason.error',
    t,
  });

const translateCommandDisabled = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: StreamTFunction;
}) => {
  const reason = normalizeReason(notification);

  if (reason === 'editing') {
    return t(
      'notifications.commandUnavailable.whileEditing.error',
      'Command not available while editing',
    );
  }

  if (reason === 'quoted_message') {
    return t(
      'notifications.commandUnavailable.whileReplying.error',
      'Command not available while replying',
    );
  }

  return t(asDynamicKey(notification?.message || 'notifications.commandUnavailable.error'));
};

const notificationTranslatorsByType: Record<
  string,
  (options: { notification: Notification; t: StreamTFunction }) => string
> = {
  'api:attachment:upload:failed': translateAttachmentUploadFailed,
  'api:location:create:failed': ({ t }) =>
    t('notifications.locationShareFailed.error', 'Failed to share location'),
  'api:location:share:failed': ({ t }) =>
    t('notifications.locationShareFailed.error', 'Failed to share location'),
  'api:poll:create:failed': translatePollCreateFailed,
  'api:poll:end:failed': translatePollEndFailed,
  'api:poll:end:success': ({ t }) => t('notifications.pollEnded.text', 'Poll ended'),
  'api:reply:search:failed': ({ t }) =>
    t('notifications.threadNotFound.error', 'Thread has not been found'),
  'browser:audio:playback:error': ({ notification, t }) =>
    notification.message
      ? translateExternalString(t, notification.message)
      : t('notifications.recordingPlaybackFailed.error', 'Error reproducing the recording'),
  'browser:location:get:failed': ({ t }) =>
    t('notifications.locationRetrieveFailed.error', 'Failed to retrieve location'),
  'channel:jumpToFirstUnread:failed': ({ t }) =>
    t('channel.jumpToFirstUnreadFailed.error', 'Failed to jump to the first unread message'),
  'validation:attachment:file:missing': ({ t }) =>
    t('notifications.attachmentFileMissing.error', 'File is required for upload attachment'),
  'validation:attachment:id:missing': ({ t }) =>
    t('notifications.attachmentIdMissing.error', 'Local upload attachment missing local id'),
  'validation:attachment:upload:blocked': translateAttachmentUploadBlocked,
  'validation:attachment:upload:in-progress': ({ t }) =>
    t('notifications.attachmentUploadInProgress.error', 'Wait until all attachments have uploaded'),
  'validation:command:disabled': translateCommandDisabled,
  'validation:poll:castVote:limit': ({ t }) =>
    t(
      'notifications.voteLimitReached.error',
      'Reached the vote limit. Remove an existing vote first.',
    ),
};

export const getNotificationDisplayMessage = ({
  notification,
  t,
}: {
  notification: Notification;
  t: StreamTFunction;
}) => {
  const translator = notification.type
    ? notificationTranslatorsByType[notification.type]
    : undefined;

  // `notification.message` can be English emitted by `stream-chat`; the map resolves the ones
  // we recognise and passes anything else through unchanged.
  return translator
    ? translator({ notification, t })
    : translateExternalString(t, notification.message);
};
