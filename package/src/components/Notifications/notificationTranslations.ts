import { CORE_NOTIFICATION_TYPE } from 'stream-chat';
import type { CoreNotificationType, Notification } from 'stream-chat';

import type { StreamTFunction } from '../../i18n/types';
import { asDynamicKey } from '../../i18n/utils';

type NotificationTranslator = (options: {
  notification: Notification;
  t: StreamTFunction;
}) => string;

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

  // `stream-chat` emits `'replying'`. This branch read `'quoted_message'` and so never matched, which
  // meant the reply case fell through and rendered core's untranslated English instead.
  if (reason === 'replying') {
    return t(
      'notifications.commandUnavailable.whileReplying.error',
      'Command not available while replying',
    );
  }

  return t('notifications.commandUnavailable.error', 'Command not available');
};

/**
 * A translator for every notification `stream-chat` itself emits.
 *
 * `Record<CoreNotificationType, …>` is the point: a new identifier in core fails to compile here until
 * it is mapped, and an entry for one that no longer exists is rejected. Before core exported the union,
 * this table and the React SDK's equivalent were hand-maintained copies of each other, and both had
 * drifted — carrying entries nothing emits while missing identifiers that fell through to untranslated
 * English.
 *
 * The key *names* stay this SDK's own. They have shipped, integrators' dictionaries are keyed on them,
 * and `build-translations` reads the literal string at the call site — a key resolved from a map would
 * be invisible to the generator and so would never reach the catalog.
 */
const coreNotificationTranslators: Record<CoreNotificationType, NotificationTranslator> = {
  [CORE_NOTIFICATION_TYPE.attachmentFileMissing]: ({ t }) =>
    t('notifications.attachmentFileMissing.error', 'File is required for upload attachment'),
  [CORE_NOTIFICATION_TYPE.attachmentIdMissing]: ({ t }) =>
    t('notifications.attachmentIdMissing.error', 'Local upload attachment missing local id'),
  [CORE_NOTIFICATION_TYPE.attachmentUploadBlocked]: translateAttachmentUploadBlocked,
  [CORE_NOTIFICATION_TYPE.attachmentUploadFailed]: translateAttachmentUploadFailed,
  [CORE_NOTIFICATION_TYPE.attachmentUploadInProgress]: ({ t }) =>
    t('notifications.attachmentUploadInProgress.error', 'Wait until all attachments have uploaded'),
  [CORE_NOTIFICATION_TYPE.commandDisabled]: translateCommandDisabled,
  // The three below were unmapped, so they rendered untranslated English from `notification.message`.
  [CORE_NOTIFICATION_TYPE.commandNotReady]: ({ t }) =>
    t('notifications.commandNotReady.error', 'Command not ready to be sent'),
  [CORE_NOTIFICATION_TYPE.locationCreateFailed]: ({ t }) =>
    t('notifications.locationShareFailed.error', 'Failed to share location'),
  [CORE_NOTIFICATION_TYPE.messageJumpFailed]: ({ t }) =>
    t('notifications.messageJumpFailed.error', 'Failed to jump to the message'),
  [CORE_NOTIFICATION_TYPE.messageJumpToLatestFailed]: ({ t }) =>
    t('notifications.messageJumpToLatestFailed.error', 'Failed to jump to the latest message'),
  [CORE_NOTIFICATION_TYPE.pollCastVoteLimit]: ({ t }) =>
    t(
      'notifications.voteLimitReached.error',
      'Reached the vote limit. Remove an existing vote first.',
    ),
  [CORE_NOTIFICATION_TYPE.pollCreateFailed]: translatePollCreateFailed,
};

/**
 * Translators for notifications this SDK emits itself, which core knows nothing about.
 *
 * Deliberately not exhaustiveness-checked — there is no union to check against — so keep it to
 * identifiers that are actually emitted. `api:reply:search:failed`, `api:location:share:failed` and
 * `browser:location:get:failed` were removed: all three were copied over from the React SDK and none is
 * emitted here.
 */
const sdkNotificationTranslators: Record<string, NotificationTranslator> = {
  'api:poll:end:failed': translatePollEndFailed,
  'api:poll:end:success': ({ t }) => t('notifications.pollEnded.text', 'Poll ended'),
  'browser:audio:playback:error': ({ notification, t }) =>
    notification.message ||
    t('notifications.recordingPlaybackFailed.error', 'Error reproducing the recording'),
  'channel:jumpToFirstUnread:failed': ({ t }) =>
    t('channel.jumpToFirstUnreadFailed.error', 'Failed to jump to the first unread message'),
};

const notificationTranslatorsByType: Record<string, NotificationTranslator> = {
  ...coreNotificationTranslators,
  ...sdkNotificationTranslators,
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

  // An unrecognized identifier renders `message` verbatim. It is untranslated English, but a newer
  // core — or an integrator emitting its own identifier — must not produce an empty toast. This used
  // to run the message through a table of English sentences, which is the mechanism core's `type`
  // replaced: matching on prose went stale silently on every core upgrade.
  return translator ? translator({ notification, t }) : notification.message;
};
