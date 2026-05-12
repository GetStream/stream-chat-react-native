import type { TFunction } from 'i18next';
import type { Notification } from 'stream-chat';

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
  t: TFunction;
}) => {
  const reason = normalizeReason(notification);
  if (!reason) return t(fallbackTranslationKey);

  return t(reasonTranslationKey, { reason });
};

const translateAttachmentUploadBlocked = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: TFunction;
}) => {
  const rawReason = notification?.metadata?.reason;
  let reason = t('unsupported file type');
  if (typeof rawReason !== 'string') reason = t('unknown error');
  if (rawReason === 'size_limit') reason = t('size limit');

  return t('Attachment upload blocked due to {{reason}}', { reason });
};

const translateAttachmentUploadFailed = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: TFunction;
}) =>
  withReasonFallback({
    fallbackTranslationKey: 'Error uploading attachment',
    notification,
    reasonTranslationKey: 'Attachment upload failed due to {{reason}}',
    t,
  });

const translatePollCreateFailed = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: TFunction;
}) =>
  withReasonFallback({
    fallbackTranslationKey: 'Failed to create the poll',
    notification,
    reasonTranslationKey: 'Failed to create the poll due to {{reason}}',
    t,
  });

const translatePollEndFailed = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: TFunction;
}) =>
  withReasonFallback({
    fallbackTranslationKey: 'Failed to end the poll',
    notification,
    reasonTranslationKey: 'Failed to end the poll due to {{reason}}',
    t,
  });

const translateCommandDisabled = ({
  notification,
  t,
}: {
  notification?: Notification;
  t: TFunction;
}) => {
  const reason = normalizeReason(notification);

  if (reason === 'editing') {
    return t('Command not available while editing');
  }

  if (reason === 'quoted_message') {
    return t('Command not available while replying');
  }

  return t(notification?.message || 'Command not available');
};

const notificationTranslatorsByType: Record<
  string,
  (options: { notification: Notification; t: TFunction }) => string
> = {
  'api:attachment:upload:failed': translateAttachmentUploadFailed,
  'api:location:create:failed': ({ t }) => t('Failed to share location'),
  'api:location:share:failed': ({ t }) => t('Failed to share location'),
  'api:poll:create:failed': translatePollCreateFailed,
  'api:poll:end:failed': translatePollEndFailed,
  'api:poll:end:success': ({ t }) => t('Poll ended'),
  'api:reply:search:failed': ({ t }) => t('Thread has not been found'),
  'browser:audio:playback:error': ({ notification, t }) =>
    notification.message ? t(notification.message) : t('Error reproducing the recording'),
  'browser:location:get:failed': ({ t }) => t('Failed to retrieve location'),
  'channel:jumpToFirstUnread:failed': ({ t }) => t('Failed to jump to the first unread message'),
  'validation:attachment:file:missing': ({ t }) => t('File is required for upload attachment'),
  'validation:attachment:id:missing': ({ t }) => t('Local upload attachment missing local id'),
  'validation:attachment:upload:blocked': translateAttachmentUploadBlocked,
  'validation:attachment:upload:in-progress': ({ t }) =>
    t('Wait until all attachments have uploaded'),
  'validation:command:disabled': translateCommandDisabled,
  'validation:poll:castVote:limit': ({ t }) =>
    t('Reached the vote limit. Remove an existing vote first.'),
};

export const getNotificationDisplayMessage = ({
  notification,
  t,
}: {
  notification: Notification;
  t: TFunction;
}) => {
  const translator = notification.type
    ? notificationTranslatorsByType[notification.type]
    : undefined;

  return translator ? translator({ notification, t }) : t(notification.message);
};
